import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { configApi, type AppConfig } from "@/services/config"
import { useAuthStore } from "@/store/auth"
import {
  BarChart3,
  ChevronsUpDown,
  Landmark,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"

const ALL_NAV_ITEMS = [
  {
    key: "feature.transactions",
    title: "Transactions",
    url: "/",
    icon: Receipt,
  },
  {
    key: "feature.accounts",
    title: "Accounts",
    url: "/accounts",
    icon: Wallet,
  },
  {
    key: "feature.summary",
    title: "Summary",
    url: "/summary",
    icon: BarChart3,
  },
  { key: "feature.emis", title: "EMIs", url: "/emis", icon: Landmark },
  { key: "feature.groups", title: "Groups", url: "/groups", icon: Users },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(
    new Set(ALL_NAV_ITEMS.map((i) => i.key))
  )
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    configApi
      .list()
      .then(({ data }) => {
        setEnabledKeys(
          new Set(
            data
              .filter(
                (c: AppConfig) =>
                  c.key.startsWith("feature.") && c.value === "true"
              )
              .map((c: AppConfig) => c.key)
          )
        )
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true))
  }, [])

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "?")

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <span className="text-lg font-bold tracking-tight">KeepCoins</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {!configLoaded
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton disabled>
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  : ALL_NAV_ITEMS.filter((item) =>
                      enabledKeys.has(item.key)
                    ).map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={pathname === item.url}
                          render={<Link to={item.url} />}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton className="w-full" />}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-left text-sm">
                    {user?.username ?? user?.email}
                  </span>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {user?.is_superuser && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Settings
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-full" />
          <span className="text-sm font-medium">
            {ALL_NAV_ITEMS.find((i) => i.url === pathname)?.title ??
              (pathname === "/settings"
                ? "Settings"
                : pathname === "/admin"
                  ? "Admin Settings"
                  : pathname.startsWith("/groups/")
                    ? "Groups"
                    : "")}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
