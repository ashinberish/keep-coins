import { cn } from "@/lib/utils"
import { Coins } from "lucide-react"

export function Logo({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const iconSize =
    size === "sm" ? "size-5" : size === "lg" ? "size-10" : "size-6"
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-3xl"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Coins className={cn(iconSize, "text-primary")} />
      <span className={cn(textSize, "font-bold tracking-tight")}>
        KeepCoins
      </span>
    </div>
  )
}
