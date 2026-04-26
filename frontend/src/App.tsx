import { AppLayout } from "@/components/AppLayout"
import { GuestRoute } from "@/components/GuestRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useTheme } from "@/components/theme-provider"
import AccountsPage from "@/pages/AccountsPage"
import AdminSettingsPage from "@/pages/AdminSettingsPage"
import EmiPage from "@/pages/EmiPage"
import ExpensesPage from "@/pages/ExpensesPage"
import GroupDetailPage from "@/pages/GroupDetailPage"
import GroupsPage from "@/pages/GroupsPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import SettingsPage from "@/pages/SettingsPage"
import SignupPage from "@/pages/SignupPage"
import SummaryPage from "@/pages/SummaryPage"
import VerifyEmailPage from "@/pages/VerifyEmailPage"
import { useAuthStore } from "@/store/auth"
import { useEffect } from "react"
import { Route, Routes } from "react-router"
import { Toaster } from "sonner"

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
    </>
  )
}

export default App
