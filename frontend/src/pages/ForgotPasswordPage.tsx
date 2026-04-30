import { AppVersion } from "@/components/AppVersion"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { authApi } from "@/services/auth"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

type Step = "email" | "code" | "new-password"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast.success("Reset code sent! Check your email.")
      setStep("code")
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (code.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }
    setStep("new-password")
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(email, code, newPassword)
      toast.success("Password reset successfully! Please sign in.")
      navigate("/login")
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="justify-center" size="sm" />
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {step === "email" ? (
                <Mail className="h-5 w-5 text-muted-foreground" />
              ) : (
                <KeyRound className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === "email" && "Forgot password?"}
              {step === "code" && "Check your email"}
              {step === "new-password" && "Set new password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "email" &&
                "Enter your email and we'll send you a reset code."}
              {step === "code" && `We sent a 6-digit code to ${email}`}
              {step === "new-password" &&
                "Choose a strong password for your account."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send reset code
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label className="sr-only">Reset code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={code}
                    onChange={(value) => {
                      setCode(value)
                      setError(null)
                    }}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="size-12 text-xl font-semibold"
                      />
                      <InputOTPSlot
                        index={1}
                        className="size-12 text-xl font-semibold"
                      />
                      <InputOTPSlot
                        index={2}
                        className="size-12 text-xl font-semibold"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={3}
                        className="size-12 text-xl font-semibold"
                      />
                      <InputOTPSlot
                        index={4}
                        className="size-12 text-xl font-semibold"
                      />
                      <InputOTPSlot
                        index={5}
                        className="size-12 text-xl font-semibold"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6}
              >
                Continue
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  try {
                    await authApi.forgotPassword(email)
                    toast.success("New code sent!")
                  } catch {
                    toast.error("Failed to resend code")
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Resend code
              </Button>
            </form>
          )}

          {/* Step 3: New password */}
          {step === "new-password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8+ characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError(null)
                    }}
                    required
                    autoFocus
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
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError(null)
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset password
              </Button>
            </form>
          )}

          {/* Back to login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
      <AppVersion />
    </div>
  )
}
