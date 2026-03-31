"use client"

import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Edit2, Trash2, BookOpen } from "lucide-react"
import type { Livro } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LivrosPage() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLivro, setEditingLivro] = useState<Livro | null>(null)
  const [titulo, setTitulo] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryParams = new URLSearchParams()
  if (search) queryParams.set("search", search)

  const { data: livros, error, mutate } = useSWR<Livro[]>(
    `/api/livros?${queryParams.toString()}`,
    fetcher
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setIsSubmitting(true)
    try {
      if (editingLivro) {
        await fetch(`/api/livros/${editingLivro.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, quantidade }),
        })
      } else {
        await fetch("/api/livros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, quantidade }),
        })
      }
      setTitulo("")
      setQuantidade(1)
      setEditingLivro(null)
      setIsDialogOpen(false)
      mutate()
    } catch (error) {
      console.error("Erro ao salvar livro:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteLivro = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este livro?")) return

    try {
      const res = await fetch(`/api/livros/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Erro ao remover livro")
        return
      }
      mutate()
    } catch (error) {
      console.error("Erro ao remover livro:", error)
    }
  }

  const openEditDialog = (livro: Livro) => {
    setEditingLivro(livro)
    setTitulo(livro.titulo)
    setQuantidade(livro.quantidade)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingLivro(null)
    setTitulo("")
    setQuantidade(1)
    setIsDialogOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-destructive">Erro ao carregar livros.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Livros</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Livro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLivro ? "Editar Livro" : "Novo Livro"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Título
                  </label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Digite o título do livro"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar livro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Acervo ({livros?.length ?? 0} títulos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!livros ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : livros.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum livro encontrado.
              </p>
            ) : (
              <div className="divide-y">
                {livros.map((livro) => {
                  const disponivel = livro.quantidade_disponivel ?? livro.quantidade
                  const isDisponivel = disponivel > 0
                  return (
                    <div
                      key={livro.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{livro.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {disponivel} de {livro.quantidade} disponíveis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={isDisponivel ? "disponivel" : "indisponivel"}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(livro)}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLivro(livro.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
