"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, BookCopy, Check, DollarSign } from "lucide-react"
import type { Emprestimo, EmprestimoItem } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface EmprestimoComItens extends Emprestimo {
  cliente_nome: string
  cliente_status: string
  itens: EmprestimoItem[]
}

export default function EmprestimosPage() {
  const [showAtivos, setShowAtivos] = useState(true)
  const [devolucaoDialog, setDevolucaoDialog] = useState<EmprestimoComItens | null>(null)
  const [itensDanificados, setItensDanificados] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: emprestimos, error, mutate } = useSWR<EmprestimoComItens[]>(
    `/api/emprestimos${showAtivos ? "?ativos=true" : ""}`,
    fetcher
  )

  const handleDevolucao = async () => {
    if (!devolucaoDialog) return

    setIsSubmitting(true)
    try {
      await fetch(`/api/emprestimos/${devolucaoDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devolvido: true,
          itens_danificados: itensDanificados,
        }),
      })
      setDevolucaoDialog(null)
      setItensDanificados([])
      mutate()
    } catch (error) {
      console.error("Erro ao registrar devolução:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const marcarPago = async (id: number) => {
    try {
      await fetch(`/api/emprestimos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: true }),
      })
      mutate()
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
    }
  }

  const toggleItemDanificado = (itemId: number) => {
    setItensDanificados((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-destructive">Erro ao carregar empréstimos.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Empréstimos</h1>
          <div className="flex gap-2">
            <Button
              variant={showAtivos ? "default" : "outline"}
              onClick={() => setShowAtivos(true)}
            >
              Ativos
            </Button>
            <Button
              variant={!showAtivos ? "default" : "outline"}
              onClick={() => setShowAtivos(false)}
            >
              Todos
            </Button>
            <Link href="/emprestimos/novo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Empréstimo
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              {showAtivos ? "Empréstimos Ativos" : "Todos os Empréstimos"} ({emprestimos?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!emprestimos ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : emprestimos.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum empréstimo encontrado.
              </p>
            ) : (
              <div className="divide-y">
                {emprestimos.map((emp) => {
                  const dataEmprestimo = new Date(emp.data_emprestimo)
                  const dataDevolucao = new Date(emp.data_devolucao)
                  const isAtrasado = !emp.devolvido && dataDevolucao < new Date()
                  const livros = emp.itens?.map((i) => i.livro_titulo).join(", ") || "N/A"

                  return (
                    <div key={emp.id} className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <BookCopy className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {emp.cliente_nome}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {livros}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Emprestado em {dataEmprestimo.toLocaleDateString("pt-BR")} | 
                              Devolução até {dataDevolucao.toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {emp.devolvido ? (
                              <StatusBadge status="devolvido" />
                            ) : isAtrasado ? (
                              <StatusBadge status="atrasado" />
                            ) : (
                              <StatusBadge status="pendente" />
                            )}
                            {emp.pago ? (
                              <span className="text-xs text-primary">Pago</span>
                            ) : (
                              <span className="text-xs text-warning">R$ {emp.valor.toFixed(2)}</span>
                            )}
                          </div>
                          {!emp.devolvido && (
                            <div className="flex gap-1">
                              {!emp.pago && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => marcarPago(emp.id)}
                                >
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  Pagar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDevolucaoDialog(emp)
                                  setItensDanificados([])
                                }}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Devolver
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!devolucaoDialog} onOpenChange={() => setDevolucaoDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Devolução</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cliente: <span className="font-medium text-foreground">{devolucaoDialog?.cliente_nome}</span>
              </p>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Marque os livros danificados (se houver):
                </p>
                <div className="space-y-2">
                  {devolucaoDialog?.itens?.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={itensDanificados.includes(item.id)}
                        onCheckedChange={() => toggleItemDanificado(item.id)}
                      />
                      <span className="text-sm text-foreground">{item.livro_titulo}</span>
                      {itensDanificados.includes(item.id) && (
                        <span className="ml-auto text-xs text-destructive">Danificado</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDevolucaoDialog(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleDevolucao} disabled={isSubmitting}>
                  {isSubmitting ? "Registrando..." : "Confirmar Devolução"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
