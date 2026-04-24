import { SplashScreen } from "@/components/SplashScreen"
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
  const isLoading = useAuthStore((s) => s.isLoading)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user || isLoading) {
    return <SplashScreen />
  }

  if (!skipOnboardingCheck && !user.is_onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
