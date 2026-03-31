import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q") || ""

    if (!q || q.trim() === "") {
      return NextResponse.json({ clientes: [], livros: [] })
    }

    const searchTerm = `%${q.trim()}%`

    // Buscar clientes
    const clientes = await sql`
      SELECT id, nome, telefone, email, status
      FROM clientes
      WHERE nome ILIKE ${searchTerm}
      ORDER BY nome ASC
      LIMIT 10
    `

    // Buscar livros - CORRIGIDO: removendo referência a e.devolvido
    const livros = await sql`
      SELECT 
        l.id,
        l.titulo,
        l.autor,
        l.isbn,
        l.categoria,
        l.quantidade,
        l.quantidade_disponivel,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM emprestimo_itens ei
            JOIN emprestimos e ON e.id = ei.emprestimo_id
            WHERE ei.livro_id = l.id 
              AND ei.devolvido = false
              AND e.data_devolucao_real IS NULL
          ), 
          0
        ) as quantidade_emprestada
      FROM livros l
      WHERE l.titulo ILIKE ${searchTerm}
         OR l.autor ILIKE ${searchTerm}
         OR l.isbn ILIKE ${searchTerm}
      ORDER BY l.titulo ASC
      LIMIT 10
    `

    // Converter os dados dos livros para ter quantidade_disponivel correta
    const livrosFormatados = livros.map((livro: any) => ({
      ...livro,
      quantidade_disponivel: livro.quantidade - (livro.quantidade_emprestada || 0)
    }))

    return NextResponse.json({ clientes, livros: livrosFormatados })
  } catch (error) {
    console.error("Erro na busca:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", clientes: [], livros: [] },
      { status: 500 }
    )
  }
}