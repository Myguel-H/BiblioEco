import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const disponivel = searchParams.get("disponivel")

    let livros
    if (search) {
      livros = await sql`
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
        WHERE l.titulo ILIKE ${'%' + search + '%'}
        ORDER BY l.titulo ASC
      `
    } else {
      livros = await sql`
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
        ORDER BY l.titulo ASC
      `
    }

    if (disponivel === "true") {
      livros = livros.filter((l: { quantidade_disponivel: number }) => l.quantidade_disponivel > 0)
    }

    return NextResponse.json(livros)
  } catch (error) {
    console.error("Erro ao buscar livros:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titulo, quantidade } = body

    if (!titulo || titulo.trim() === "") {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
    }

    const qtd = Number(quantidade) || 1

    if (qtd < 1) {
      return NextResponse.json({ error: "Quantidade deve ser pelo menos 1" }, { status: 400 })
    }

    const livro = await sql`
      INSERT INTO livros (titulo, quantidade)
      VALUES (${titulo.trim()}, ${qtd})
      RETURNING *
    `

    return NextResponse.json(livro[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar livro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
