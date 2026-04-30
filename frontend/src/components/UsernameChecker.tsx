import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/services/auth"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface UsernameCheckerProps {
  value: string
  onChange: (value: string) => void
  currentUsername?: string
  label?: string
  placeholder?: string
  autoFocus?: boolean
}

export function UsernameChecker({
  value,
  onChange,
  currentUsername,
  label = "Username",
  placeholder = "Pick a unique username",
  autoFocus = false,
}: UsernameCheckerProps) {
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkUsername = useCallback(
    async (username: string) => {
      if (!username || username.length < 3) {
        setStatus("idle")
        setSuggestions([])
        return
      }

      if (currentUsername && username === currentUsername) {
        setStatus("idle")
        setSuggestions([])
        return
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
      if (!usernameRegex.test(username)) {
        setStatus("invalid")
        setSuggestions([])
        return
      }

      setStatus("checking")
      try {
        const { data } = await authApi.checkUsername(username)
        if (data.available) {
          setStatus("available")
          setSuggestions([])
        } else {
          setStatus("taken")
          setSuggestions(data.suggestions)
        }
      } catch {
        setStatus("idle")
      }
    },
    [currentUsername]
  )

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      checkUsername(value)
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, checkUsername])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="username"
          autoFocus={autoFocus}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {status === "checking" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {status === "available" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {status === "taken" && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {status === "invalid" && (
            <XCircle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>

      {status === "invalid" && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Username must be 3-30 characters (letters, numbers, underscores only)
        </p>
      )}

      {status === "taken" && (
        <div className="space-y-1">
          <p className="text-xs text-destructive">Username is already taken</p>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">Try:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(s)}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "available" && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Username is available
        </p>
      )}
    </div>
  )
}
