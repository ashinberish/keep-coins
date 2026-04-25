import { Logo } from "@/components/Logo"

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex animate-in flex-col items-center gap-4 duration-300 fade-in">
        <Logo size="lg" />
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
