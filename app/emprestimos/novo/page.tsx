"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, ArrowLeft, BookOpen, User, AlertCircle } from "lucide-react"
import type { Cliente, Livro } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const MAX_LIVROS = 3
const VALOR_EMPRESTIMO = 5.0

export default function NovoEmprestimoPage() {
  const router = useRouter()
  const [searchCliente, setSearchCliente] = useState("")
  const [searchLivro, setSearchLivro] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [livrosSelecionados, setLivrosSelecionados] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: clientes } = useSWR<Cliente[]>(
    searchCliente.length >= 2 ? `/api/clientes?search=${searchCliente}&status=ativo` : null,
    fetcher
  )

  const { data: livros } = useSWR<Livro[]>(
    `/api/livros?disponivel=true${searchLivro ? `&search=${searchLivro}` : ""}`,
    fetcher
  )

  const toggleLivro = (livroId: number) => {
    setLivrosSelecionados((prev) => {
      if (prev.includes(livroId)) {
        return prev.filter((id) => id !== livroId)
      }
      if (prev.length >= MAX_LIVROS) {
        return prev
      }
      return [...prev, livroId]
    })
  }

  const handleSubmit = async () => {
  if (!clienteSelecionado || livrosSelecionados.length === 0) return

  setIsSubmitting(true)
  setError(null)

  try {
    // Preparar os dados no formato que o backend espera
    const livrosParaEnviar = livrosSelecionados.map(id => ({ id }))
    
    const res = await fetch("/api/emprestimos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: clienteSelecionado.id,  // ← mudou de cliente_id para clienteId
        livros: livrosParaEnviar,          // ← mudou de livro_ids para livros (array de objetos)
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Erro ao criar empréstimo")
      return
    }

    router.push("/emprestimos")
  } catch (err) {
    setError("Erro ao criar empréstimo")
    console.error(err)
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Novo Empréstimo</h1>
          <p className="text-muted-foreground">
            Valor: R$ {VALOR_EMPRESTIMO.toFixed(2)} | Prazo: 30 dias
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-2 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Seleção de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <User className="h-5 w-5" />
                1. Selecionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clienteSelecionado ? (
                <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {clienteSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{clienteSelecionado.nome}</p>
                      <StatusBadge status="ativo" />
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setClienteSelecionado(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente pelo nome..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchCliente.length >= 2 && (
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {clientes && clientes.length > 0 ? (
                        clientes.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => {
                              setClienteSelecionado(cliente)
                              setSearchCliente("")
                            }}
                            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                              {cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{cliente.nome}</span>
                          </button>
                        ))
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Livros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <BookOpen className="h-5 w-5" />
                2. Selecionar Livros ({livrosSelecionados.length}/{MAX_LIVROS})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar livro..."
                    value={searchLivro}
                    onChange={(e) => setSearchLivro(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {livrosSelecionados.length > 0 && (
                  <div className="rounded-lg border bg-primary/5 p-3">
                    <p className="mb-2 text-sm font-medium text-foreground">Livros selecionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {livros
                        ?.filter((l) => livrosSelecionados.includes(l.id))
                        .map((livro) => (
                          <span
                            key={livro.id}
                            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            {livro.titulo}
                            <button
                              onClick={() => toggleLivro(livro.id)}
                              className="ml-2 text-primary hover:text-primary/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {livros && livros.length > 0 ? (
                    livros
                      .filter((l) => !livrosSelecionados.includes(l.id))
                      .map((livro) => {
                        const disponivel = livro.quantidade_disponivel ?? livro.quantidade
                        return (
                          <label
                            key={livro.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted ${
                              livrosSelecionados.length >= MAX_LIVROS ? "opacity-50" : ""
                            }`}
                          >
                            <Checkbox
                              checked={livrosSelecionados.includes(livro.id)}
                              onCheckedChange={() => toggleLivro(livro.id)}
                              disabled={livrosSelecionados.length >= MAX_LIVROS}
                            />
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{livro.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {disponivel} disponíveis
                              </p>
                            </div>
                          </label>
                        )
                      })
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum livro disponível
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-foreground">
                    {clienteSelecionado?.nome || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livros:</span>
                  <span className="font-medium text-foreground">{livrosSelecionados.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-foreground">R$ {VALOR_EMPRESTIMO.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium text-foreground">30 dias</span>
                </div>
              </div>
              <Button
                className="mt-6 w-full"
                disabled={!clienteSelecionado || livrosSelecionados.length === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Criando..." : "Confirmar Empréstimo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
