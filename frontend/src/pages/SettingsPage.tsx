import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CURRENCIES, currencyIcon } from "@/lib/currency"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, setCurrency } = useAuthStore()
  const currentCurrency = user?.currency ?? "USD"
  const CurrentIcon = currencyIcon(currentCurrency)

  const handleCurrencyChange = async (value: string) => {
    try {
      await setCurrency(value)
      toast.success(`Currency changed to ${value}`)
    } catch {
      toast.error("Failed to update currency")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label>Username</Label>
            <Input value={user?.username ?? ""} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Profile editing is not yet available.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <Select
              value={currentCurrency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <CurrentIcon className="h-4 w-4" />
                    {currentCurrency}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <c.icon className="mr-2 inline h-4 w-4" />
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This symbol will be used across all pages.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Member since</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-destructive">Danger Zone</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Account deletion is not yet available.
            </p>
            <Button variant="destructive" size="sm" className="mt-3" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
