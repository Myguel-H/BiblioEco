-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Livros
CREATE TABLE IF NOT EXISTS livros (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  isbn VARCHAR(20),
  quantidade INTEGER DEFAULT 1,
  quantidade_disponivel INTEGER DEFAULT 1,
  categoria VARCHAR(100),
  localizacao VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Empréstimos
CREATE TABLE IF NOT EXISTS emprestimos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_emprestimo DATE DEFAULT CURRENT_DATE,
  data_devolucao_prevista DATE NOT NULL,
  data_devolucao_real DATE,
  valor DECIMAL(10, 2) DEFAULT 5.00,
  pago BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'devolvido', 'atrasado')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Empréstimo (relacionamento N:N entre empréstimos e livros)
CREATE TABLE IF NOT EXISTS emprestimo_itens (
  id SERIAL PRIMARY KEY,
  emprestimo_id INTEGER NOT NULL REFERENCES emprestimos(id) ON DELETE CASCADE,
  livro_id INTEGER NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
  devolvido BOOLEAN DEFAULT false,
  danificado BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros(titulo);
CREATE INDEX IF NOT EXISTS idx_livros_autor ON livros(autor);
CREATE INDEX IF NOT EXISTS idx_emprestimos_cliente ON emprestimos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON emprestimos(status);
CREATE INDEX IF NOT EXISTS idx_emprestimo_itens_emprestimo ON emprestimo_itens(emprestimo_id);
CREATE INDEX IF NOT EXISTS idx_emprestimo_itens_livro ON emprestimo_itens(livro_id);
