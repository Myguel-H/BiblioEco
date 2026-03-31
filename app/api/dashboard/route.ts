import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Total de livros e disponíveis
    const livrosStats = await sql`
      SELECT 
        COALESCE(SUM(quantidade), 0) as total,
        COALESCE(SUM(quantidade), 0) as disponiveis
      FROM livros
    `

    // Livros emprestados (não devolvidos)
    const emprestados = await sql`
      SELECT COUNT(DISTINCT ei.livro_id) as count
      FROM emprestimo_itens ei
      JOIN emprestimos e ON e.id = ei.emprestimo_id
      WHERE ei.devolvido = false AND e.devolvido = false
    `

    // Total de clientes
    const totalClientes = await sql`
      SELECT COUNT(*) as count FROM clientes
    `

    // Clientes bloqueados
    const clientesBloqueados = await sql`
      SELECT COUNT(*) as count FROM clientes WHERE status = 'bloqueado'
    `

    // Empréstimos ativos
    const emprestimosAtivos = await sql`
      SELECT COUNT(*) as count FROM emprestimos WHERE devolvido = false
    `

    // Empréstimos atrasados (mais de 30 dias)
    const emprestimosAtrasados = await sql`
      SELECT COUNT(*) as count 
      FROM emprestimos 
      WHERE devolvido = false 
      AND data_emprestimo < NOW() - INTERVAL '30 days'
    `

    // Valores a receber (não pagos)
    const valoresReceber = await sql`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM emprestimos 
      WHERE pago = false
    `

    // Últimos empréstimos
    const ultimosEmprestimos = await sql`
      SELECT 
        e.id,
        e.data_emprestimo,
        e.data_devolucao,
        e.devolvido,
        e.pago,
        c.nome as cliente_nome,
        (SELECT COUNT(*) FROM emprestimo_itens WHERE emprestimo_id = e.id) as total_livros
      FROM emprestimos e
      JOIN clientes c ON c.id = e.cliente_id
      ORDER BY e.created_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      livros: {
        total: Number(livrosStats[0]?.total) || 0,
        disponiveis: Math.max(0, (Number(livrosStats[0]?.disponiveis) || 0) - (Number(emprestados[0]?.count) || 0)),
        emprestados: Number(emprestados[0]?.count) || 0,
      },
      clientes: {
        total: Number(totalClientes[0]?.count) || 0,
        bloqueados: Number(clientesBloqueados[0]?.count) || 0,
      },
      emprestimos: {
        ativos: Number(emprestimosAtivos[0]?.count) || 0,
        atrasados: Number(emprestimosAtrasados[0]?.count) || 0,
      },
      financeiro: {
        receber: Number(valoresReceber[0]?.total) || 0,
      },
      ultimosEmprestimos: ultimosEmprestimos,
    })
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
