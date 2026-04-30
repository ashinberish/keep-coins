import { AppLayout } from "@/components/AppLayout"
import { GuestRoute } from "@/components/GuestRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/auth"
import { lazy, Suspense, useEffect } from "react"
import { Route, Routes } from "react-router"
import { Toaster } from "sonner"

const LoginPage = lazy(() => import("@/pages/LoginPage"))
const SignupPage = lazy(() => import("@/pages/SignupPage"))
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"))
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"))
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"))
const SummaryPage = lazy(() => import("@/pages/SummaryPage"))
const EmiPage = lazy(() => import("@/pages/EmiPage"))
const AccountsPage = lazy(() => import("@/pages/AccountsPage"))
const GroupsPage = lazy(() => import("@/pages/GroupsPage"))
const GroupDetailPage = lazy(() => import("@/pages/GroupDetailPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const AdminSettingsPage = lazy(() => import("@/pages/AdminSettingsPage"))

export function App() {
  const { isAuthenticated, fetchUser, user } = useAuthStore()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    }
  }, [])

  // Sync theme from DB when user loads
  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme as "light" | "dark" | "system")
    }
  }, [user?.theme])

  return (
    <>
      <Toaster richColors position="top-center" />
      <Suspense>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <GuestRoute>
                <VerifyEmailPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute skipOnboardingCheck>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ExpensesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SummaryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emis"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EmiPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AccountsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GroupsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GroupDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminSettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
