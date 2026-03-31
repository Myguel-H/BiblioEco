import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    let clientes
    if (search && status) {
      clientes = await sql`
        SELECT * FROM clientes 
        WHERE nome ILIKE ${'%' + search + '%'} 
        AND status = ${status}
        ORDER BY nome ASC
      `
    } else if (search) {
      clientes = await sql`
        SELECT * FROM clientes 
        WHERE nome ILIKE ${'%' + search + '%'}
        ORDER BY nome ASC
      `
    } else if (status) {
      clientes = await sql`
        SELECT * FROM clientes 
        WHERE status = ${status}
        ORDER BY nome ASC
      `
    } else {
      clientes = await sql`SELECT * FROM clientes ORDER BY nome ASC`
    }

    return NextResponse.json(clientes)
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome || nome.trim() === "") {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const cliente = await sql`
      INSERT INTO clientes (nome, status)
      VALUES (${nome.trim()}, 'ativo')
      RETURNING *
    `

    return NextResponse.json(cliente[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
