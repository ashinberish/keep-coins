import { AppLayout } from "@/components/AppLayout"
import { GuestRoute } from "@/components/GuestRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import EmiPage from "@/pages/EmiPage"
import ExpensesPage from "@/pages/ExpensesPage"
import LoginPage from "@/pages/LoginPage"
import SettingsPage from "@/pages/SettingsPage"
import SignupPage from "@/pages/SignupPage"
import SummaryPage from "@/pages/SummaryPage"
import { useAuthStore } from "@/store/auth"
import { useEffect } from "react"
import { Route, Routes } from "react-router"
import { Toaster } from "sonner"

export function App() {
  const { isAuthenticated, fetchUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    }
  }, [])

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
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
