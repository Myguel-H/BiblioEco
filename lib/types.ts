export interface Cliente {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  status: "ativo" | "bloqueado"
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Livro {
  id: number
  titulo: string
  autor: string | null
  isbn: string | null
  quantidade: number
  quantidade_disponivel: number
  categoria: string | null
  localizacao: string | null
  created_at: string
  updated_at: string
}

export interface Emprestimo {
  id: number
  cliente_id: number
  data_emprestimo: string
  data_devolucao_prevista: string
  data_devolucao_real: string | null
  valor: number
  pago: boolean
  status: "ativo" | "devolvido" | "atrasado"
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface EmprestimoItem {
  id: number
  emprestimo_id: number
  livro_id: number
  devolvido: boolean
  danificado: boolean
  observacoes: string | null
  created_at: string
}

// Tipos expandidos para exibição
export interface EmprestimoComDetalhes extends Emprestimo {
  cliente_nome: string
  cliente_status: string
  itens: EmprestimoItemComLivro[]
}

export interface EmprestimoItemComLivro extends EmprestimoItem {
  livro_titulo: string
  livro_autor: string | null
}

export interface DashboardStats {
  total_clientes: number
  clientes_ativos: number
  clientes_bloqueados: number
  total_livros: number
  livros_disponiveis: number
  livros_emprestados: number
  emprestimos_ativos: number
  emprestimos_atrasados: number
  valor_a_receber: number
  valor_recebido: number
}
