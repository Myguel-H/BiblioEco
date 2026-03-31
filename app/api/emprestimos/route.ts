import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Definindo tipos
interface LivroSelecionado {
  id: number
  titulo: string
  quantidade: number
}

interface EmprestimoBody {
  clienteId: number
  livros: LivroSelecionado[]
  dataDevolucaoPrevista?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ativos = searchParams.get("ativos") === "true"
    const clienteId = searchParams.get("clienteId")

    let emprestimos

    if (ativos) {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          (
            SELECT COUNT(*) 
            FROM emprestimo_itens ei 
            WHERE ei.emprestimo_id = e.id AND ei.devolvido = false
          ) as itens_nao_devolvidos
        FROM emprestimos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE e.data_devolucao_real IS NULL
        ORDER BY e.data_emprestimo DESC
      `
    } else if (clienteId) {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          (
            SELECT COUNT(*) 
            FROM emprestimo_itens ei 
            WHERE ei.emprestimo_id = e.id AND ei.devolvido = false
          ) as itens_nao_devolvidos
        FROM emprestimos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        WHERE e.cliente_id = ${Number(clienteId)}
        ORDER BY e.data_emprestimo DESC
      `
    } else {
      emprestimos = await sql`
        SELECT 
          e.*,
          c.nome as cliente_nome,
          (
            SELECT COUNT(*) 
            FROM emprestimo_itens ei 
            WHERE ei.emprestimo_id = e.id AND ei.devolvido = false
          ) as itens_nao_devolvidos
        FROM emprestimos e
        LEFT JOIN clientes c ON e.cliente_id = c.id
        ORDER BY e.data_emprestimo DESC
      `
    }

    return NextResponse.json(emprestimos)
  } catch (error) {
    console.error("Erro ao buscar empréstimos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo empréstimo (versão sem transação)
export async function POST(request: NextRequest) {
  try {
    const body: EmprestimoBody = await request.json()
    const { clienteId, livros, dataDevolucaoPrevista } = body

    // Validações
    if (!clienteId) {
      return NextResponse.json({ error: "Cliente é obrigatório" }, { status: 400 })
    }

    if (!livros || !Array.isArray(livros) || livros.length === 0) {
      return NextResponse.json({ error: "Pelo menos um livro é obrigatório" }, { status: 400 })
    }

    // Calcular data de devolução (padrão 30 dias se não informada)
    const hoje = new Date()
    const dataDevolucao = dataDevolucaoPrevista 
      ? new Date(dataDevolucaoPrevista)
      : new Date(hoje.setDate(hoje.getDate() + 30))

    // 1. Criar o empréstimo
    const emprestimoResult = await sql`
      INSERT INTO emprestimos (
        cliente_id,
        data_emprestimo,
        data_devolucao_prevista,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${clienteId},
        ${new Date()},
        ${dataDevolucao},
        'ativo',
        NOW(),
        NOW()
      )
      RETURNING *
    `
    
    const emprestimo = emprestimoResult[0]

    if (!emprestimo) {
      throw new Error("Falha ao criar empréstimo")
    }

    // 2. Criar os itens do empréstimo
    for (const livro of livros) {
      await sql`
        INSERT INTO emprestimo_itens (
          emprestimo_id,
          livro_id,
          devolvido,
          created_at
        )
        VALUES (
          ${emprestimo.id},
          ${livro.id},
          false,
          NOW()
        )
      `
    }

    return NextResponse.json({ 
      success: true, 
      emprestimo: emprestimo,
      message: "Empréstimo criado com sucesso!" 
    }, { status: 201 })

  } catch (error: any) {
    console.error("Erro detalhado ao criar empréstimo:", error)
    return NextResponse.json({ 
      error: "Erro ao criar empréstimo",
      details: error?.message || "Erro desconhecido"
    }, { status: 500 })
  }
}