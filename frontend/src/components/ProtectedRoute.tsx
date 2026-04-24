import { useAuthStore } from "@/store/auth"
import { Navigate } from "react-router"

export function ProtectedRoute({
  children,
  skipOnboardingCheck,
}: {
  children: React.ReactNode
  skipOnboardingCheck?: boolean
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!skipOnboardingCheck && user && !user.is_onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
