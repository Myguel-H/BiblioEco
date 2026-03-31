import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
      WHERE l.id = ${id}
    `

    if (livro.length === 0) {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
    }

    // Histórico de empréstimos do livro
    const emprestimos = await sql`
      SELECT 
        e.id,
        e.data_emprestimo,
        e.data_devolucao,
        e.devolvido,
        c.nome as cliente_nome,
        ei.danificado
      FROM emprestimo_itens ei
      JOIN emprestimos e ON e.id = ei.emprestimo_id
      JOIN clientes c ON c.id = e.cliente_id
      WHERE ei.livro_id = ${id}
      ORDER BY e.created_at DESC
    `

    return NextResponse.json({
      ...livro[0],
      emprestimos,
    })
  } catch (error) {
    console.error("Erro ao buscar livro:", error)
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
    const { titulo, quantidade } = body

    let livro
    if (titulo !== undefined && quantidade !== undefined) {
      livro = await sql`
        UPDATE livros 
        SET titulo = ${titulo.trim()}, quantidade = ${Number(quantidade)}
        WHERE id = ${id}
        RETURNING *
      `
    } else if (titulo !== undefined) {
      livro = await sql`
        UPDATE livros SET titulo = ${titulo.trim()} WHERE id = ${id} RETURNING *
      `
    } else if (quantidade !== undefined) {
      livro = await sql`
        UPDATE livros SET quantidade = ${Number(quantidade)} WHERE id = ${id} RETURNING *
      `
    } else {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    if (livro.length === 0) {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
    }

    return NextResponse.json(livro[0])
  } catch (error) {
    console.error("Erro ao atualizar livro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se tem empréstimos ativos
    const emprestimosAtivos = await sql`
      SELECT COUNT(*) as count 
      FROM emprestimo_itens ei
      JOIN emprestimos e ON e.id = ei.emprestimo_id
      WHERE ei.livro_id = ${id} AND ei.devolvido = false AND e.devolvido = false
    `

    if (Number(emprestimosAtivos[0]?.count) > 0) {
      return NextResponse.json(
        { error: "Livro está emprestado" },
        { status: 400 }
      )
    }

    const livro = await sql`
      DELETE FROM livros WHERE id = ${id} RETURNING *
    `

    if (livro.length === 0) {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Livro removido com sucesso" })
  } catch (error) {
    console.error("Erro ao remover livro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
