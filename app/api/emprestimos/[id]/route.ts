import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET - Buscar um empréstimo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }
    
    const [emprestimo] = await sql`
      SELECT 
        e.*,
        c.nome as cliente_nome,
        c.status as cliente_status
      FROM emprestimos e
      LEFT JOIN clientes c ON e.cliente_id = c.id
      WHERE e.id = ${id}
    `
    
    if (!emprestimo) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 })
    }
    
    // Buscar os itens do empréstimo
    const itens = await sql`
      SELECT 
        ei.*,
        l.titulo as livro_titulo,
        l.autor as livro_autor
      FROM emprestimo_itens ei
      LEFT JOIN livros l ON ei.livro_id = l.id
      WHERE ei.emprestimo_id = ${id}
      ORDER BY ei.id ASC
    `
    
    return NextResponse.json({ ...emprestimo, itens })
  } catch (error) {
    console.error("Erro ao buscar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Atualizar empréstimo (pagar, devolver, etc)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }
    
    const body = await request.json()
    const { pago, devolvido, itens_danificados } = body
    
    // Atualizar pagamento
    if (pago !== undefined) {
      await sql`
        UPDATE emprestimos
        SET pago = ${pago}, updated_at = NOW()
        WHERE id = ${id}
      `
    }
    
    // Registrar devolução
    if (devolvido === true) {
      // 1. Atualizar o empréstimo com a data de devolução real
      await sql`
        UPDATE emprestimos
        SET data_devolucao_real = NOW(), 
            status = 'devolvido',
            updated_at = NOW()
        WHERE id = ${id}
      `
      
      // 2. Marcar todos os itens como devolvidos (sem updated_at)
      await sql`
        UPDATE emprestimo_itens
        SET devolvido = true
        WHERE emprestimo_id = ${id}
      `
      
      // 3. Marcar itens danificados (sem updated_at)
      if (itens_danificados && itens_danificados.length > 0) {
        await sql`
          UPDATE emprestimo_itens
          SET danificado = true
          WHERE id = ANY(${itens_danificados}::int[])
        `
      }
      
      // 4. Atualizar a quantidade disponível dos livros
      const itens = await sql`
        SELECT livro_id FROM emprestimo_itens 
        WHERE emprestimo_id = ${id}
      `
      
      for (const item of itens) {
        await sql`
          UPDATE livros
          SET quantidade_disponivel = quantidade_disponivel + 1,
              updated_at = NOW()
          WHERE id = ${item.livro_id}
        `
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Cancelar empréstimo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }
    
    // Verificar se o empréstimo existe
    const [emprestimo] = await sql`
      SELECT * FROM emprestimos WHERE id = ${id}
    `
    
    if (!emprestimo) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 })
    }
    
    // Se já foi devolvido, não pode cancelar
    if (emprestimo.data_devolucao_real !== null) {
      return NextResponse.json({ error: "Empréstimo já devolvido não pode ser cancelado" }, { status: 400 })
    }
    
    // Cancelar o empréstimo (deletar itens e o empréstimo)
    await sql`
      DELETE FROM emprestimo_itens WHERE emprestimo_id = ${id}
    `
    
    await sql`
      DELETE FROM emprestimos WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao cancelar empréstimo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}