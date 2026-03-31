import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cliente = await sql`
      SELECT * FROM clientes WHERE id = ${id}
    `

    if (cliente.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // Buscar histórico de empréstimos
    const emprestimos = await sql`
      SELECT 
        e.*,
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
      WHERE e.cliente_id = ${id}
      ORDER BY e.created_at DESC
    `

    // Contar livros danificados
    const danificados = await sql`
      SELECT COUNT(*) as count
      FROM emprestimo_itens ei
      JOIN emprestimos e ON e.id = ei.emprestimo_id
      WHERE e.cliente_id = ${id} AND ei.danificado = true
    `

    return NextResponse.json({
      ...cliente[0],
      emprestimos,
      totalDanificados: Number(danificados[0]?.count) || 0,
    })
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
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
    const { nome, status } = body

    const updates: string[] = []
    const values: (string | number)[] = []

    if (nome !== undefined) {
      updates.push("nome")
      values.push(nome.trim())
    }

    if (status !== undefined) {
      if (!["ativo", "bloqueado"].includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 })
      }
      updates.push("status")
      values.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    let cliente
    if (nome !== undefined && status !== undefined) {
      cliente = await sql`
        UPDATE clientes 
        SET nome = ${nome.trim()}, status = ${status}
        WHERE id = ${id}
        RETURNING *
      `
    } else if (nome !== undefined) {
      cliente = await sql`
        UPDATE clientes SET nome = ${nome.trim()} WHERE id = ${id} RETURNING *
      `
    } else {
      cliente = await sql`
        UPDATE clientes SET status = ${status} WHERE id = ${id} RETURNING *
      `
    }

    if (cliente.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente[0])
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
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
      SELECT COUNT(*) as count FROM emprestimos 
      WHERE cliente_id = ${id} AND devolvido = false
    `

    if (Number(emprestimosAtivos[0]?.count) > 0) {
      return NextResponse.json(
        { error: "Cliente possui empréstimos ativos" },
        { status: 400 }
      )
    }

    const cliente = await sql`
      DELETE FROM clientes WHERE id = ${id} RETURNING *
    `

    if (cliente.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Cliente removido com sucesso" })
  } catch (error) {
    console.error("Erro ao remover cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
