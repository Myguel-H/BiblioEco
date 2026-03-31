import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ clientes: [], livros: [] })
    }

    const clientes = await sql`
      SELECT id, nome, status 
      FROM clientes 
      WHERE nome ILIKE ${'%' + query + '%'}
      ORDER BY nome ASC
      LIMIT 10
    `

    const livros = await sql`
      SELECT 
        l.id, 
        l.titulo, 
        l.quantidade,
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
      WHERE l.titulo ILIKE ${'%' + query + '%'}
      ORDER BY l.titulo ASC
      LIMIT 10
    `

    return NextResponse.json({ clientes, livros })
  } catch (error) {
    console.error("Erro na busca:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
