import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const VALOR_EMPRESTIMO = 5.0
const MAX_LIVROS_POR_EMPRESTIMO = 3

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ativos = searchParams.get("ativos") === "true"
    const clienteId = searchParams.get("cliente_id")

    let emprestimos
    if (ativos && clienteId) {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          c.status as cliente_status,
          (SELECT json_agg(json_build_object(
            'id', ei.id,
            'livro_id', ei.livro_id,
            'livro_titulo', l.titulo,
            'danificado', ei.danificado,
            'devolvido', ei.devolvido
          ))
          FROM emprestimo_itens ei
          JOIN livros l ON l.id = ei.livro_id
          WHERE ei.emprestimo_id = e.id) as itens
        FROM emprestimos e
        JOIN clientes c ON c.id = e.cliente_id
        WHERE e.devolvido = false AND e.cliente_id = ${clienteId}
        ORDER BY e.created_at DESC
      `
    } else if (ativos) {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          c.status as cliente_status,
          (SELECT json_agg(json_build_object(
            'id', ei.id,
            'livro_id', ei.livro_id,
            'livro_titulo', l.titulo,
            'danificado', ei.danificado,
            'devolvido', ei.devolvido
          ))
          FROM emprestimo_itens ei
          JOIN livros l ON l.id = ei.livro_id
          WHERE ei.emprestimo_id = e.id) as itens
        FROM emprestimos e
        JOIN clientes c ON c.id = e.cliente_id
        WHERE e.devolvido = false
        ORDER BY e.created_at DESC
      `
    } else if (clienteId) {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          c.status as cliente_status,
          (SELECT json_agg(json_build_object(
            'id', ei.id,
            'livro_id', ei.livro_id,
            'livro_titulo', l.titulo,
            'danificado', ei.danificado,
            'devolvido', ei.devolvido
          ))
          FROM emprestimo_itens ei
          JOIN livros l ON l.id = ei.livro_id
          WHERE ei.emprestimo_id = e.id) as itens
        FROM emprestimos e
        JOIN clientes c ON c.id = e.cliente_id
        WHERE e.cliente_id = ${clienteId}
        ORDER BY e.created_at DESC
      `
    } else {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          c.status as cliente_status,
          (SELECT json_agg(json_build_object(
            'id', ei.id,
            'livro_id', ei.livro_id,
            'livro_titulo', l.titulo,
            'danificado', ei.danificado,
            'devolvido', ei.devolvido
          ))
          FROM emprestimo_itens ei
          JOIN livros l ON l.id = ei.livro_id
          WHERE ei.emprestimo_id = e.id) as itens
        FROM emprestimos e
        JOIN clientes c ON c.id = e.cliente_id
        ORDER BY e.created_at DESC
      `
    }

    return NextResponse.json(emprestimos)
  } catch (error) {
    console.error("Erro ao buscar empréstimos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, livro_ids } = body

    if (!cliente_id) {
      return NextResponse.json({ error: "Cliente é obrigatório" }, { status: 400 })
    }

    if (!livro_ids || !Array.isArray(livro_ids) || livro_ids.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos um livro" }, { status: 400 })
    }

    if (livro_ids.length > MAX_LIVROS_POR_EMPRESTIMO) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_LIVROS_POR_EMPRESTIMO} livros por empréstimo` },
        { status: 400 }
      )
    }

    // Verificar se cliente está ativo
    const cliente = await sql`SELECT * FROM clientes WHERE id = ${cliente_id}`
    if (cliente.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }
    if (cliente[0].status === "bloqueado") {
      return NextResponse.json({ error: "Cliente bloqueado não pode fazer empréstimos" }, { status: 400 })
    }

    // Verificar disponibilidade dos livros
    for (const livroId of livro_ids) {
      const livro = await sql`
        SELECT 
          l.*,
          COALESCE(
            l.quantidade - (
              SELECT COUNT(*)
              FROM emprestimo_itens ei
              JOIN emprestimos e ON e.id = ei.emprestimo_id
              WHERE ei.livro_id = l.id AND ei.devolvido = false AND e.devolvido = false
            ), 
            l.quantidade
          ) as quantidade_disponivel
        FROM livros l
        WHERE l.id = ${livroId}
      `
      if (livro.length === 0) {
        return NextResponse.json({ error: `Livro ${livroId} não encontrado` }, { status: 404 })
      }
      if (livro[0].quantidade_disponivel <= 0) {
        return NextResponse.json(
          { error: `Livro "${livro[0].titulo}" não está disponível` },
          { status: 400 }
        )
      }
    }

    // Calcular data de devolução (30 dias)
    const dataDevolucao = new Date()
    dataDevolucao.setDate(dataDevolucao.getDate() + 30)

    // Criar empréstimo
    const emprestimo = await sql`
      INSERT INTO emprestimos (cliente_id, data_devolucao, valor, pago, devolvido)
      VALUES (${cliente_id}, ${dataDevolucao.toISOString()}, ${VALOR_EMPRESTIMO}, false, false)
      RETURNING *
    `

    // Criar itens do empréstimo
    for (const livroId of livro_ids) {
      await sql`
        INSERT INTO emprestimo_itens (emprestimo_id, livro_id, danificado, devolvido)
        VALUES (${emprestimo[0].id}, ${livroId}, false, false)
      `
    }

    return NextResponse.json(emprestimo[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
