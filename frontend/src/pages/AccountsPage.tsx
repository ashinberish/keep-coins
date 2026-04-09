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
import { formatCurrency } from "@/lib/currency"
import {
  accountsApi,
  type Account,
} from "@/services/accounts"
import { useAuthStore } from "@/store/auth"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

const ICON_OPTIONS = [
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

export default function AccountsPage() {
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("")
  const [iconOpen, setIconOpen] = useState(false)
  const [accountType, setAccountType] = useState<"bank" | "cash" | "credit_card">("bank")
  const [creditLimit, setCreditLimit] = useState("")
  const [balance, setBalance] = useState("")
  const [debt, setDebt] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Edit form
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [editIconOpen, setEditIconOpen] = useState(false)
  const [editAccountType, setEditAccountType] = useState<"bank" | "cash" | "credit_card">("bank")
  const [editCreditLimit, setEditCreditLimit] = useState("")
  const [editBalance, setEditBalance] = useState("")
  const [editDebt, setEditDebt] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const { data } = await accountsApi.list()
      setAccounts(data)
    } catch {
      toast.error("Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  function resetCreateForm() {
    setName("")
    setIcon("")
    setAccountType("bank")
    setCreditLimit("")
    setBalance("")
    setDebt("")
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const { data } = await accountsApi.create({
        name: name.trim(),
        icon: icon || undefined,
        type: accountType,
        credit_limit: accountType === "credit_card" && creditLimit ? parseFloat(creditLimit) : undefined,
        balance: balance ? parseFloat(balance) : undefined,
        debt: debt ? parseFloat(debt) : undefined,
      })
      setAccounts((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
      resetCreateForm()
      setCreateOpen(false)
      toast.success("Account created")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create account"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(account: Account) {
    setEditId(account.id)
    setEditName(account.name)
    setEditIcon(account.icon)
    setEditAccountType(account.type)
    setEditCreditLimit(account.credit_limit?.toString() ?? "")
    setEditBalance(account.balance.toString())
    setEditDebt(account.debt.toString())
    setEditOpen(true)
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!editId || !editName.trim()) return
    setEditSubmitting(true)
    try {
      const { data } = await accountsApi.update(editId, {
        name: editName.trim(),
        icon: editIcon || undefined,
        type: editAccountType,
        credit_limit: editAccountType === "credit_card" && editCreditLimit ? parseFloat(editCreditLimit) : null,
        balance: editBalance ? parseFloat(editBalance) : 0,
        debt: editDebt ? parseFloat(editDebt) : 0,
      })
      setAccounts((prev) =>
        prev
          .map((a) => (a.id === data.id ? data : a))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditOpen(false)
      toast.success("Account updated")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to update account"
      toast.error(message)
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await accountsApi.delete(deleteId)
      setAccounts((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteOpen(false)
      setDeleteId(null)
      toast.success("Account deleted")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to delete account"
      toast.error(message)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const totalDebt = accounts.reduce((sum, a) => sum + Number(a.debt), 0)
  const netWorth = totalBalance - totalDebt

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalBalance, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Debt</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p
              className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(netWorth, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts list */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Accounts</h2>
        <Button
          size="sm"
          onClick={() => {
            resetCreateForm()
            setCreateOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Account
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No accounts yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{account.icon}</span>
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <Badge variant={account.type === "credit_card" ? "destructive" : "secondary"} className="mt-0.5 text-[10px] px-1.5 py-0">
                      {account.type === "credit_card" ? "Credit Card" : account.type === "cash" ? "Cash" : "Bank"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      setDeleteId(account.id)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {account.type === "credit_card" ? (
                    <>
                      {account.credit_limit != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Limit</span>
                          <span className="font-medium">
                            {formatCurrency(Number(account.credit_limit), currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Used</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(Number(account.debt), currency)}
                        </span>
                      </div>
                      {account.credit_limit != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(
                              Number(account.credit_limit) - Number(account.debt),
                              currency
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(Number(account.balance), currency)}
                        </span>
                      </div>
                      {Number(account.debt) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Debt</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(Number(account.debt), currency)}
                          </span>
                        </div>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net</span>
                        <span
                          className={`font-semibold ${Number(account.balance) - Number(account.debt) >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(
                            Number(account.balance) - Number(account.debt),
                            currency
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>
                Create a new account to track your balance and debts.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-end gap-3">
                <div className="grid gap-1.5">
                  <Label>Icon</Label>
                  <Popover open={iconOpen} onOpenChange={setIconOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-9 w-16 text-lg"
                        />
                      }
                    >
                      {icon || "💳"}
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-8 gap-1">
                        {ICON_OPTIONS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
                            onClick={() => {
                              setIcon(e)
                              setIconOpen(false)
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="acc-name">Name</Label>
                  <Input
                    id="acc-name"
                    placeholder="e.g. Savings Account"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as typeof accountType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {accountType === "credit_card" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="acc-limit">Credit Limit</Label>
                    <Input
                      id="acc-limit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="acc-debt">Current Debt</Label>
                    <Input
                      id="acc-debt"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={debt}
                      onChange={(e) => setDebt(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="acc-balance">Balance</Label>
                    <Input
                      id="acc-balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="acc-debt">Debt</Label>
                    <Input
                      id="acc-debt"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={debt}
                      onChange={(e) => setDebt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>Update the account details.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-end gap-3">
                <div className="grid gap-1.5">
                  <Label>Icon</Label>
                  <Popover open={editIconOpen} onOpenChange={setEditIconOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-9 w-16 text-lg"
                        />
                      }
                    >
                      {editIcon || "💳"}
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-8 gap-1">
                        {ICON_OPTIONS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
                            onClick={() => {
                              setEditIcon(e)
                              setEditIconOpen(false)
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={editAccountType} onValueChange={(v) => setEditAccountType(v as typeof editAccountType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editAccountType === "credit_card" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-limit">Credit Limit</Label>
                    <Input
                      id="edit-limit"
                      type="number"
                      step="0.01"
                      value={editCreditLimit}
                      onChange={(e) => setEditCreditLimit(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-debt">Current Debt</Label>
                    <Input
                      id="edit-debt"
                      type="number"
                      step="0.01"
                      value={editDebt}
                      onChange={(e) => setEditDebt(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-balance">Balance</Label>
                    <Input
                      id="edit-balance"
                      type="number"
                      step="0.01"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-debt">Debt</Label>
                    <Input
                      id="edit-debt"
                      type="number"
                      step="0.01"
                      value={editDebt}
                      onChange={(e) => setEditDebt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? Transactions linked
              to it will keep their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
