import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CURRENCIES, currencyIcon } from "@/lib/currency"
import { categoriesApi, type Category } from "@/services/categories"
import {
  paymentMethodsApi,
  type PaymentMethod,
} from "@/services/payment-methods"
import { useAuthStore } from "@/store/auth"
import { Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

const EMOJI_OPTIONS = [
  "🍔",
  "🚗",
  "🛍️",
  "🎬",
  "💡",
  "💪",
  "📚",
  "✈️",
  "🛒",
  "📦",
  "🏠",
  "💰",
  "🎮",
  "☕",
  "🍕",
  "🎵",
  "💊",
  "🐾",
  "👶",
  "🎁",
  "📱",
  "💻",
  "🔧",
  "🧹",
  "👔",
  "💄",
  "🚌",
  "🏥",
  "🏋️",
  "🎓",
  "🍺",
  "🌿",
  "⛽",
  "📰",
  "🧾",
  "🏦",
  "🎂",
  "✂️",
  "🧸",
  "📁",
]

const PM_ICON_OPTIONS = [
  "💳",
  "💵",
  "🏦",
  "📱",
  "🪙",
  "💎",
  "🏧",
  "💸",
  "🤑",
  "📲",
]

export default function SettingsPage() {
  const { user, setCurrency, setDefaultPaymentMethod } = useAuthStore()
  const currentCurrency = user?.currency ?? "USD"
  const CurrentIcon = currencyIcon(currentCurrency)

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catName, setCatName] = useState("")
  const [catEmoji, setCatEmoji] = useState("")
  const [catEmojiOpen, setCatEmojiOpen] = useState(false)
  const [catDesc, setCatDesc] = useState("")
  const [catSubmitting, setCatSubmitting] = useState(false)

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [pmLoading, setPmLoading] = useState(true)
  const [pmName, setPmName] = useState("")
  const [pmIcon, setPmIcon] = useState("")
  const [pmIconOpen, setPmIconOpen] = useState(false)
  const [pmSubmitting, setPmSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchPaymentMethods()
  }, [])

  async function fetchCategories() {
    try {
      const { data } = await categoriesApi.list()
      setCategories(data)
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setCatLoading(false)
    }
  }

  async function fetchPaymentMethods() {
    try {
      const { data } = await paymentMethodsApi.list()
      setPaymentMethods(data)
    } catch {
      toast.error("Failed to load payment methods")
    } finally {
      setPmLoading(false)
    }
  }

  async function handleCatSubmit(e: FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    setCatSubmitting(true)
    try {
      const { data } = await categoriesApi.create({
        name: catName.trim(),
        emoji: catEmoji || undefined,
        description: catDesc.trim() || undefined,
      })
      setCategories((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
      setCatName("")
      setCatEmoji("")
      setCatDesc("")
      toast.success("Category created")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create category"
      toast.error(message)
    } finally {
      setCatSubmitting(false)
    }
  }

  async function handleCatDelete(id: string) {
    try {
      await categoriesApi.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success("Category deleted")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to delete category"
      toast.error(message)
    }
  }

  async function handlePmSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pmName.trim()) return
    setPmSubmitting(true)
    try {
      const { data } = await paymentMethodsApi.create({
        name: pmName.trim(),
        icon: pmIcon || undefined,
      })
      setPaymentMethods((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
      setPmName("")
      setPmIcon("")
      toast.success("Payment method created")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create payment method"
      toast.error(message)
    } finally {
      setPmSubmitting(false)
    }
  }

  async function handlePmDelete(id: string) {
    try {
      await paymentMethodsApi.delete(id)
      setPaymentMethods((prev) => prev.filter((p) => p.id !== id))
      toast.success("Payment method deleted")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to delete payment method"
      toast.error(message)
    }
  }

  const handleCurrencyChange = async (value: string | null) => {
    if (!value) return
    try {
      await setCurrency(value)
      toast.success(`Currency changed to ${value}`)
    } catch {
      toast.error("Failed to update currency")
    }
  }

  const handleDefaultPmChange = async (value: string | null) => {
    try {
      const id = value === "none" ? null : value
      await setDefaultPaymentMethod(id)
      toast.success(
        id ? "Default payment method updated" : "Default payment method cleared"
      )
    } catch {
      toast.error("Failed to update default payment method")
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
          <Separator />
          <div className="grid gap-1.5">
            <Label>Default Payment Method</Label>
            <Select
              value={user?.default_payment_method_id ?? "none"}
              onValueChange={handleDefaultPmChange}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue>
                  {user?.default_payment_method_id
                    ? (() => {
                        const pm = paymentMethods.find(
                          (p) => p.id === user.default_payment_method_id
                        )
                        return pm ? `${pm.icon} ${pm.name}` : "None"
                      })()
                    : "None"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="none">None</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    <span className="mr-2">{pm.icon}</span>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Auto-selected when adding new expenses.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleCatSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="grid gap-1.5">
              <Label>Emoji</Label>
              <Popover open={catEmojiOpen} onOpenChange={setCatEmojiOpen}>
                <PopoverTrigger
                  render={
                    <Button variant="outline" className="h-9 w-16 text-lg" />
                  }
                >
                  {catEmoji || "📁"}
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
                        onClick={() => {
                          setCatEmoji(e)
                          setCatEmojiOpen(false)
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid w-48 gap-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Subscriptions"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>
            <div className="grid w-64 gap-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                placeholder="e.g. Monthly subscriptions"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={catSubmitting}>
              {catSubmitting ? "Adding…" : "Add"}
            </Button>
          </form>
          <Separator />
          {catLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Emoji</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-lg">{category.emoji}</TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      {category.user_id ? (
                        <Badge variant="secondary">Custom</Badge>
                      ) : (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCatDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handlePmSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="grid gap-1.5">
              <Label>Icon</Label>
              <Popover open={pmIconOpen} onOpenChange={setPmIconOpen}>
                <PopoverTrigger
                  render={
                    <Button variant="outline" className="h-9 w-16 text-lg" />
                  }
                >
                  {pmIcon || "💳"}
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="grid grid-cols-8 gap-1">
                    {PM_ICON_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
                        onClick={() => {
                          setPmIcon(e)
                          setPmIconOpen(false)
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid w-48 gap-1.5">
              <Label htmlFor="pm-name">Name</Label>
              <Input
                id="pm-name"
                placeholder="e.g. Credit Card"
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pmSubmitting}>
              {pmSubmitting ? "Adding…" : "Add"}
            </Button>
          </form>
          <Separator />
          {pmLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : paymentMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment methods yet. Add one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((pm) => (
                  <TableRow key={pm.id}>
                    <TableCell className="text-lg">{pm.icon}</TableCell>
                    <TableCell className="font-medium">{pm.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePmDelete(pm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
