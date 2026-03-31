import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: "default" | "primary" | "warning" | "destructive"
  description?: string
}

export function StatCard({ title, value, icon: Icon, variant = "default", description }: StatCardProps) {
  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      variant === "primary" && "border-primary/30 bg-primary/5",
      variant === "warning" && "border-warning/30 bg-warning/5",
      variant === "destructive" && "border-destructive/30 bg-destructive/5"
    )}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
          variant === "default" && "bg-muted text-muted-foreground",
          variant === "primary" && "bg-primary/10 text-primary",
          variant === "warning" && "bg-warning/10 text-warning",
          variant === "destructive" && "bg-destructive/10 text-destructive"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold",
            variant === "default" && "text-foreground",
            variant === "primary" && "text-primary",
            variant === "warning" && "text-warning",
            variant === "destructive" && "text-destructive"
          )}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
