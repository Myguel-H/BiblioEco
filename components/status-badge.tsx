import { cn } from "@/lib/utils"

type StatusVariant = "ativo" | "bloqueado" | "pendente" | "atrasado" | "devolvido" | "disponivel" | "indisponivel"

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  ativo: "bg-primary/10 text-primary border-primary/20",
  bloqueado: "bg-destructive/10 text-destructive border-destructive/20",
  pendente: "bg-warning/10 text-warning border-warning/20",
  atrasado: "bg-destructive/10 text-destructive border-destructive/20",
  devolvido: "bg-muted text-muted-foreground border-border",
  disponivel: "bg-primary/10 text-primary border-primary/20",
  indisponivel: "bg-destructive/10 text-destructive border-destructive/20",
}

const labels: Record<StatusVariant, string> = {
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  pendente: "Pendente",
  atrasado: "Atrasado",
  devolvido: "Devolvido",
  disponivel: "Disponível",
  indisponivel: "Indisponível",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variantStyles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  )
}
