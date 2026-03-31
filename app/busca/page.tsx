"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, User, BookOpen } from "lucide-react"
import type { Cliente, Livro } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BuscaResult {
  clientes: Cliente[]
  livros: Livro[]
}

export default function BuscaPage() {
  const [query, setQuery] = useState("")

  const { data, isLoading } = useSWR<BuscaResult>(
    query.length >= 2 ? `/api/busca?q=${encodeURIComponent(query)}` : null,
    fetcher
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Busca Rápida</h1>

        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes ou livros..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-12 text-lg"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {query.length < 2 ? (
          <p className="text-center text-muted-foreground">
            Digite pelo menos 2 caracteres para buscar
          </p>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="h-5 w-5" />
                  Clientes ({data?.clientes.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.clientes && data.clientes.length > 0 ? (
                  <div className="divide-y">
                    {data.clientes.map((cliente) => (
                      <Link
                        key={cliente.id}
                        href="/clientes"
                        className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{cliente.nome}</span>
                        </div>
                        <StatusBadge
                          status={cliente.status === "ativo" ? "ativo" : "bloqueado"}
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-muted-foreground">
                    Nenhum cliente encontrado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Livros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <BookOpen className="h-5 w-5" />
                  Livros ({data?.livros.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.livros && data.livros.length > 0 ? (
                  <div className="divide-y">
                    {data.livros.map((livro) => {
                      const disponivel = livro.quantidade_disponivel ?? livro.quantidade
                      return (
                        <Link
                          key={livro.id}
                          href="/livros"
                          className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50"
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
                          <StatusBadge
                            status={disponivel > 0 ? "disponivel" : "indisponivel"}
                          />
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-4 text-center text-muted-foreground">
                    Nenhum livro encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
