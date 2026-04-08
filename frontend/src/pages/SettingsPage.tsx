import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { accountsApi, type Account } from "@/services/accounts"
import { categoriesApi, type Category } from "@/services/categories"
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

export default function SettingsPage() {
  const {
    user,
    setCurrency,
    setDefaultAccount,
    updateUsername,
    deleteAccount,
  } = useAuthStore()
  const currentCurrency = user?.currency ?? "USD"
  const CurrentIcon = currencyIcon(currentCurrency)

  // Username edit state
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [usernameSaving, setUsernameSaving] = useState(false)

  // Delete account dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catName, setCatName] = useState("")
  const [catEmoji, setCatEmoji] = useState("")
  const [catEmojiOpen, setCatEmojiOpen] = useState(false)
  const [catDesc, setCatDesc] = useState("")
  const [catType, setCatType] = useState<"expense" | "income">("expense")
  const [catSubmitting, setCatSubmitting] = useState(false)

  // Accounts state (for default account selector)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetchCategories()
    fetchAccounts()
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

  async function fetchAccounts() {
    try {
      const { data } = await accountsApi.list()
      setAccounts(data)
    } catch {
      toast.error("Failed to load accounts")
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
        category_type: catType,
      })
      setCategories((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
      setCatName("")
      setCatEmoji("")
      setCatDesc("")
      setCatType("expense")
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

  const handleCurrencyChange = async (value: string | null) => {
    if (!value) return
    try {
      await setCurrency(value)
      toast.success(`Currency changed to ${value}`)
    } catch {
      toast.error("Failed to update currency")
    }
  }

  const handleDefaultAccountChange = async (value: string | null) => {
    try {
      const id = value === "none" ? null : value
      await setDefaultAccount(id)
      toast.success(id ? "Default account updated" : "Default account cleared")
    } catch {
      toast.error("Failed to update default account")
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
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  autoFocus
                />
                <Button
                  size="sm"
                  disabled={usernameSaving || !newUsername.trim()}
                  onClick={async () => {
                    setUsernameSaving(true)
                    try {
                      await updateUsername(newUsername.trim())
                      toast.success("Username updated")
                      setEditingUsername(false)
                    } catch (err: unknown) {
                      const message =
                        (err as { response?: { data?: { detail?: string } } })
                          ?.response?.data?.detail ??
                        "Failed to update username"
                      toast.error(message)
                    } finally {
                      setUsernameSaving(false)
                    }
                  }}
                >
                  {usernameSaving ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingUsername(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={user?.username ?? ""} disabled />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewUsername(user?.username ?? "")
                    setEditingUsername(true)
                  }}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
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
            <Label>Default Account</Label>
            <Select
              value={user?.default_account_id ?? "none"}
              onValueChange={handleDefaultAccountChange}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue>
                  {user?.default_account_id
                    ? (() => {
                        const acct = accounts.find(
                          (a) => a.id === user.default_account_id
                        )
                        return acct ? `${acct.icon} ${acct.name}` : "None"
                      })()
                    : "None"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="none">None</SelectItem>
                {accounts.map((acct) => (
                  <SelectItem key={acct.id} value={acct.id}>
                    <span className="mr-2">{acct.icon}</span>
                    {acct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Auto-selected when adding new transactions.
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
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                value={catType}
                onValueChange={(v) => setCatType(v as "expense" | "income")}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
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
                      <Badge
                        variant={
                          category.category_type === "income"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {category.category_type === "income"
                          ? "Income"
                          : "Expense"}
                      </Badge>
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
              This will permanently deactivate your account. All your data will
              be preserved but you will no longer be able to log in.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={() => {
                setDeleteConfirm("")
                setDeleteOpen(true)
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete account confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type{" "}
              <span className="font-semibold text-destructive">delete</span>{" "}
              below to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder='Type "delete" to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "delete" || deleting}
              onClick={async () => {
                setDeleting(true)
                try {
                  await deleteAccount()
                  toast.success("Account deleted")
                } catch {
                  toast.error("Failed to delete account")
                  setDeleting(false)
                }
              }}
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
