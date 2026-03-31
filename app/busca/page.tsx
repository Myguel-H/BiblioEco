"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, User, BookOpen, UserPlus, BookPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Cliente {
  id: number
  nome: string
  telefone: string | null
  email: string | null
  status: "ativo" | "bloqueado" | "inativo"  // tipos possíveis para cliente
}

interface Livro {
  id: number
  titulo: string
  autor: string | null
  isbn: string | null
  categoria: string | null
  quantidade: number
  quantidade_disponivel: number
}

interface BuscaResult {
  clientes: Cliente[]
  livros: Livro[]
}

// Função auxiliar para converter status do cliente para StatusVariant
const getStatusVariant = (status: string): "ativo" | "bloqueado" | "pendente" | "atrasado" | "devolvido" | "disponivel" | "indisponivel" => {
  switch (status) {
    case "ativo":
      return "ativo"
    case "bloqueado":
      return "bloqueado"
    case "inativo":
      return "pendente"  // mapeia inativo para pendente
    default:
      return "pendente"
  }
}

export default function BuscaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [result, setResult] = useState<BuscaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/busca?q=${encodeURIComponent(searchTerm)}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Erro na busca")
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar")
      setResult({ clientes: [], livros: [] })
    } finally {
      setLoading(false)
    }
  }

  // Buscar quando o parâmetro q mudar
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setSearchTerm(q)
      handleSearch({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [searchParams])

  const clientes = result?.clientes || []
  const livros = result?.livros || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Busca</h1>
          <p className="text-muted-foreground">
            Busque por clientes, livros, autores ou ISBN
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do cliente, título do livro, autor ou ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </form>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && searchTerm && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="h-5 w-5" />
                  Clientes ({clientes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientes.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{cliente.nome}</p>
                          {cliente.email && (
                            <p className="text-xs text-muted-foreground">{cliente.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={getStatusVariant(cliente.status)} />
                          <Link href={`/clientes/${cliente.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Livros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <BookOpen className="h-5 w-5" />
                  Livros ({livros.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {livros.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum livro encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {livros.map((livro) => {
                      const status = livro.quantidade_disponivel > 0 ? "disponivel" : "indisponivel"
                      return (
                        <div
                          key={livro.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{livro.titulo}</p>
                            {livro.autor && (
                              <p className="text-xs text-muted-foreground">{livro.autor}</p>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              <StatusBadge status={status} />
                              <span className="text-xs text-muted-foreground">
                                {livro.quantidade_disponivel} / {livro.quantidade} disponíveis
                              </span>
                            </div>
                          </div>
                          <Link href={`/livros/${livro.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !searchTerm && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Search className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Digite um termo para buscar clientes ou livros
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push("/clientes/novo")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Cliente
                </Button>
                <Button variant="outline" onClick={() => router.push("/livros/novo")}>
                  <BookPlus className="mr-2 h-4 w-4" />
                  Cadastrar Livro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}