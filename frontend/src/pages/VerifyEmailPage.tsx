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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { useEffect, useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const {
    pendingVerificationEmail,
    verifyEmail,
    resendVerification,
    isLoading,
    error,
    clearError,
  } = useAuthStore()

  const [code, setCode] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  if (!pendingVerificationEmail) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return

    try {
      await verifyEmail(pendingVerificationEmail!, code)
      toast.success("Email verified! Let's set up your account.")
      navigate("/onboarding")
    } catch {
      // error is set in store
    }
  }

  async function handleResend() {
    try {
      await resendVerification(pendingVerificationEmail!)
      setResendCooldown(60)
      toast.success("Verification code sent!")
    } catch {
      // error is set in store
    }
  }

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
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">
              {pendingVerificationEmail}
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="sr-only">Verification code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={code}
                  onChange={(value) => {
                    setCode(value)
                    clearError()
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? "Verifying…" : "Verify email"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                className="text-primary underline disabled:no-underline disabled:opacity-50"
                onClick={handleResend}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
      <AppVersion />
    </div>
  )
}
