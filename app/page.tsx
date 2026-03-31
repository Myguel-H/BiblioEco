"use client"

import useSWR from "swr"
import { Header } from "@/components/header"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, BookCopy, DollarSign, AlertTriangle, Ban } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardData {
  livros: {
    total: number
    disponiveis: number
    emprestados: number
  }
  clientes: {
    total: number
    bloqueados: number
  }
  emprestimos: {
    ativos: number
    atrasados: number
  }
  financeiro: {
    receber: number
  }
  ultimosEmprestimos: Array<{
    id: number
    data_emprestimo: string
    data_devolucao: string
    devolvido: boolean
    pago: boolean
    cliente_nome: string
    total_livros: number
  }>
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  const hasError = error || (data && 'error' in data)

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-destructive">Erro ao carregar dados do dashboard.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Dashboard</h1>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24 p-6" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total de Livros"
                value={data?.livros?.total ?? 0}
                icon={BookOpen}
                variant="primary"
                description={`${data?.livros?.disponiveis ?? 0} disponíveis`}
              />
              <StatCard
                title="Livros Emprestados"
                value={data?.livros?.emprestados ?? 0}
                icon={BookCopy}
              />
              <StatCard
                title="Clientes Cadastrados"
                value={data?.clientes?.total ?? 0}
                icon={Users}
                variant="primary"
              />
              <StatCard
                title="Clientes Bloqueados"
                value={data?.clientes?.bloqueados ?? 0}
                icon={Ban}
                variant={(data?.clientes?.bloqueados ?? 0) > 0 ? "destructive" : "default"}
              />
              <StatCard
                title="Empréstimos Atrasados"
                value={data?.emprestimos?.atrasados ?? 0}
                icon={AlertTriangle}
                variant={(data?.emprestimos?.atrasados ?? 0) > 0 ? "warning" : "default"}
              />
              <StatCard
                title="Valores a Receber"
                value={`R$ ${(data?.financeiro?.receber ?? 0).toFixed(2)}`}
                icon={DollarSign}
                variant={(data?.financeiro?.receber ?? 0) > 0 ? "warning" : "default"}
              />
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Últimos Empréstimos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.ultimosEmprestimos && data.ultimosEmprestimos.length > 0 ? (
                  <div className="divide-y">
                    {data.ultimosEmprestimos.map((emp) => {
                      const isAtrasado = !emp.devolvido && new Date(emp.data_devolucao) < new Date()
                      return (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">{emp.cliente_nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {emp.total_livros} livro{emp.total_livros > 1 ? "s" : ""} - {" "}
                              {new Date(emp.data_emprestimo).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {emp.devolvido ? (
                              <StatusBadge status="devolvido" />
                            ) : isAtrasado ? (
                              <StatusBadge status="atrasado" />
                            ) : (
                              <StatusBadge status="pendente" />
                            )}
                            {!emp.pago && (
                              <span className="text-xs text-warning">Não pago</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhum empréstimo registrado.
                  </p>
                )}
                <div className="mt-4 border-t pt-4">
                  <Link
                    href="/emprestimos"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver todos os empréstimos
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
