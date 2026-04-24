import { Coins } from "lucide-react"

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex animate-in flex-col items-center gap-4 duration-300 fade-in">
        <div className="flex items-center gap-2">
          <Coins className="size-10 animate-pulse text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">KeepCoins</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading your data…</p>
        <div className="mt-4 flex gap-1.5">
          <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
