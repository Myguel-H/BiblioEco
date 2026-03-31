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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Edit2, Trash2, Ban, CheckCircle } from "lucide-react"
import type { Cliente } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ClientesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [nome, setNome] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryParams = new URLSearchParams()
  if (search) queryParams.set("search", search)
  if (statusFilter !== "todos") queryParams.set("status", statusFilter)

  const { data: clientes, error, mutate } = useSWR<Cliente[]>(
    `/api/clientes?${queryParams.toString()}`,
    fetcher
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setIsSubmitting(true)
    try {
      if (editingCliente) {
        await fetch(`/api/clientes/${editingCliente.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome }),
        })
      } else {
        await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome }),
        })
      }
      setNome("")
      setEditingCliente(null)
      setIsDialogOpen(false)
      mutate()
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (cliente: Cliente) => {
    try {
      await fetch(`/api/clientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: cliente.status === "ativo" ? "bloqueado" : "ativo",
        }),
      })
      mutate()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const deleteCliente = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Erro ao remover cliente")
        return
      }
      mutate()
    } catch (error) {
      console.error("Erro ao remover cliente:", error)
    }
  }

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setNome(cliente.nome)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingCliente(null)
    setNome("")
    setIsDialogOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-destructive">Erro ao carregar clientes.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nome
                  </label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite o nome do cliente"
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
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="bloqueado">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Lista de Clientes ({clientes?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!clientes ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </p>
            ) : (
              <div className="divide-y">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Cadastrado em{" "}
                          {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={cliente.status === "ativo" ? "ativo" : "bloqueado"}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(cliente)}
                        title={cliente.status === "ativo" ? "Bloquear" : "Ativar"}
                      >
                        {cliente.status === "ativo" ? (
                          <Ban className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cliente)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCliente(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
