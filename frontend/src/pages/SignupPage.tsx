import { AppVersion } from "@/components/AppVersion"
import { Logo } from "@/components/Logo"
import { UsernameChecker } from "@/components/UsernameChecker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { configApi } from "@/services/config"
import { useAuthStore } from "@/store/auth"
import { Eye, EyeOff, Loader2, ShieldX } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
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
  const [signupDisabled, setSignupDisabled] = useState(false)

  useEffect(() => {
    configApi
      .getPublic()
      .then(({ data }) => {
        if (!data.signup_enabled) setSignupDisabled(true)
      })
      .catch(() => {})
  }, [])

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
    <div className="flex min-h-svh">
      {/* Left side - decorative */}
      <div className="hidden flex-1 items-center justify-center bg-muted/30 lg:flex">
        <div className="max-w-md space-y-4 px-8">
          <Logo size="lg" />
          <p className="text-lg text-muted-foreground">
            Join thousands of users who track their finances smarter. Set up in
            under a minute.
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                1
              </div>
              <span className="text-sm text-muted-foreground">
                Create your account
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                2
              </div>
              <span className="text-sm text-muted-foreground">
                Verify your email
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                3
              </div>
              <span className="text-sm text-muted-foreground">
                Start tracking expenses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="sm" />
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            {!signupDisabled && (
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            )}
          </div>

          <div className="relative">
            {signupDisabled && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-background/80 via-background/95 to-background" />
                <div className="relative flex flex-col items-center gap-4 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-card shadow-sm">
                    <ShieldX className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      Signups are currently closed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      New registrations are not available at this time.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Back to sign in
                  </Link>
                </div>
              </div>
            )}

            <div
              className={
                signupDisabled
                  ? "pointer-events-none opacity-10 select-none"
                  : ""
              }
            >
              {displayError && (
                <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {displayError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
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

                <UsernameChecker
                  value={username}
                  onChange={(val) => {
                    setUsername(val)
                    clearError()
                    setLocalError(null)
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8+ characters"
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
                      placeholder="Repeat your password"
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || signupDisabled}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create account
                </Button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        <AppVersion />
      </div>
    </div>
  )
}
