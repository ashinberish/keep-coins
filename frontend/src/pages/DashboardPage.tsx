import { useAuthStore } from "@/store/auth"

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">
        Welcome,{" "}
        <span className="font-medium text-foreground">{user?.username}</span>!
        Your dashboard is ready.
      </p>
    </div>
  )
}
