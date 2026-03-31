import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const emprestimo = await sql`
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
      WHERE e.id = ${id}
    `

    if (emprestimo.length === 0) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(emprestimo[0])
  } catch (error) {
    console.error("Erro ao buscar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { devolvido, pago, itens_danificados } = body

    // Verificar se empréstimo existe
    const emprestimo = await sql`SELECT * FROM emprestimos WHERE id = ${id}`
    if (emprestimo.length === 0) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 })
    }

    // Se estiver marcando como devolvido
    if (devolvido === true) {
      // Marcar todos os itens como devolvidos
      await sql`
        UPDATE emprestimo_itens 
        SET devolvido = true 
        WHERE emprestimo_id = ${id}
      `

      // Marcar itens danificados se especificado
      if (itens_danificados && Array.isArray(itens_danificados)) {
        for (const itemId of itens_danificados) {
          await sql`
            UPDATE emprestimo_itens 
            SET danificado = true 
            WHERE id = ${itemId}
          `
        }
      }

      await sql`
        UPDATE emprestimos 
        SET devolvido = true, data_devolucao = NOW() 
        WHERE id = ${id}
      `
    }

    // Atualizar status de pagamento
    if (pago !== undefined) {
      await sql`UPDATE emprestimos SET pago = ${pago} WHERE id = ${id}`
    }

    // Buscar empréstimo atualizado
    const updated = await sql`
      SELECT 
        e.*,
        c.nome as cliente_nome,
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
      WHERE e.id = ${id}
    `

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Erro ao atualizar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
