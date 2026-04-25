import { AppVersion } from "@/components/AppVersion"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth"
import { Eye, EyeOff } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters")
      return
    }

    try {
      await signup(email, username, password)
      toast.success("Account created! Please verify your email.")
      navigate("/verify-email")
    } catch {
      // error is set in store
    }
  }

  const displayError = localError ?? error

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Logo className="justify-center" />
        <p className="mt-1 text-sm text-muted-foreground">
          Track your money, effortlessly.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                  setLocalError(null)
                }}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  clearError()
                  setLocalError(null)
                }}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError()
                    setLocalError(null)
                  }}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setLocalError(null)
                  }}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <AppVersion />
    </div>
  )
}
