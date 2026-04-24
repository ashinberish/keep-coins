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
import { formatCurrency } from "@/lib/currency"
import {
  accountsApi,
  type Account,
  type AccountType,
} from "@/services/accounts"
import { useAuthStore } from "@/store/auth"
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

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank / Savings",
  cash: "Cash",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
}

const ACCOUNT_TYPE_BADGE: Record<
  AccountType,
  "secondary" | "destructive" | "outline"
> = {
  bank: "secondary",
  cash: "secondary",
  debit_card: "outline",
  credit_card: "destructive",
}

type FormState = {
  name: string
  icon: string
  type: AccountType
  linkedAccountId: string
  creditLimit: string
  balance: string
  debt: string
}

function AccountFormFields({
  form,
  onChange,
  iconPickerOpen,
  setIconPickerOpen,
  bankAccounts,
}: {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  iconPickerOpen: boolean
  setIconPickerOpen: (v: boolean) => void
  bankAccounts: Account[]
}) {
  return (
    <>
      <div className="flex items-end gap-3">
        <div className="grid gap-1.5">
          <Label>Icon</Label>
          <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
            <PopoverTrigger
              render={<Button variant="outline" className="h-9 w-16 text-lg" />}
            >
              {form.icon || "💳"}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {ICON_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
                    onClick={() => {
                      onChange({ icon: e })
                      setIconPickerOpen(false)
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
          <Label>Name</Label>
          <Input
            placeholder="e.g. Savings Account"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) => onChange({ type: v as AccountType })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="bank">Bank / Savings</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="debit_card">Debit Card</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.type === "debit_card" && (
        <div className="grid gap-1.5">
          <Label>Linked Bank Account</Label>
          <Select
            value={form.linkedAccountId}
            onValueChange={(v) => onChange({ linkedAccountId: v ?? undefined })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select bank account…" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {bankAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Expenses on this card will debit the linked bank account.
          </p>
        </div>
      )}

      {form.type === "credit_card" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Credit Limit</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.creditLimit}
              onChange={(e) => onChange({ creditLimit: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Current Balance Used</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.debt}
              onChange={(e) => onChange({ debt: e.target.value })}
            />
          </div>
        </div>
      )}

      {(form.type === "bank" || form.type === "cash") && (
        <div className="grid gap-1.5">
          <Label>Current Balance</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.balance}
            onChange={(e) => onChange({ balance: e.target.value })}
          />
        </div>
      )}
    </>
  )
}

function emptyForm(): FormState {
  return {
    name: "",
    icon: "",
    type: "bank" as AccountType,
    linkedAccountId: "",
    creditLimit: "",
    balance: "",
    debt: "",
  }
}

export default function AccountsPage() {
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)

  // Edit form
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editIconOpen, setEditIconOpen] = useState(false)

  // Delete
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

  // Only bank accounts can be linked to debit cards
  const bankAccounts = accounts.filter((a) => a.type === "bank")

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setSubmitting(true)
    try {
      const { data } = await accountsApi.create({
        name: createForm.name.trim(),
        icon: createForm.icon || undefined,
        type: createForm.type,
        linked_account_id:
          createForm.type === "debit_card" && createForm.linkedAccountId
            ? createForm.linkedAccountId
            : undefined,
        credit_limit:
          createForm.type === "credit_card" && createForm.creditLimit
            ? parseFloat(createForm.creditLimit)
            : undefined,
        balance:
          createForm.type === "debit_card" || createForm.type === "credit_card"
            ? undefined
            : createForm.balance
              ? parseFloat(createForm.balance)
              : undefined,
        debt:
          createForm.type === "credit_card" && createForm.debt
            ? parseFloat(createForm.debt)
            : undefined,
      })
      setAccounts((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
      setCreateForm(emptyForm())
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
    setEditForm({
      name: account.name,
      icon: account.icon,
      type: account.type,
      linkedAccountId: account.linked_account_id ?? "",
      creditLimit: account.credit_limit?.toString() ?? "",
      balance: account.balance.toString(),
      debt: account.debt.toString(),
    })
    setEditOpen(true)
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!editId || !editForm.name.trim()) return
    setEditSubmitting(true)
    try {
      const { data } = await accountsApi.update(editId, {
        name: editForm.name.trim(),
        icon: editForm.icon || undefined,
        type: editForm.type,
        linked_account_id:
          editForm.type === "debit_card"
            ? editForm.linkedAccountId || null
            : null,
        credit_limit:
          editForm.type === "credit_card"
            ? editForm.creditLimit
              ? parseFloat(editForm.creditLimit)
              : null
            : null,
        balance:
          editForm.type === "debit_card" || editForm.type === "credit_card"
            ? undefined
            : editForm.balance
              ? parseFloat(editForm.balance)
              : 0,
        debt:
          editForm.type === "credit_card"
            ? editForm.debt
              ? parseFloat(editForm.debt)
              : 0
            : undefined,
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

  // Balance = bank + cash only (debit cards debit the linked bank; credit cards excluded)
  const totalBalance = accounts
    .filter((a) => a.type === "bank" || a.type === "cash")
    .reduce((sum, a) => sum + Number(a.balance), 0)
  const totalDebt = accounts
    .filter((a) => a.type === "credit_card")
    .reduce((sum, a) => sum + Number(a.debt), 0)
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
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bank &amp; cash accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Credit Card Debt</p>
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
            setCreateForm(emptyForm())
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
          {accounts.map((account) => {
            const linkedBank = account.linked_account_id
              ? accounts.find((a) => a.id === account.linked_account_id)
              : null
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{account.icon}</span>
                    <div>
                      <CardTitle className="text-base">
                        {account.name}
                      </CardTitle>
                      <Badge
                        variant={
                          ACCOUNT_TYPE_BADGE[account.type as AccountType]
                        }
                        className="mt-0.5 px-1.5 py-0 text-[10px]"
                      >
                        {ACCOUNT_TYPE_LABELS[account.type as AccountType] ??
                          account.type}
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
                    {account.type === "credit_card" && (
                      <>
                        {account.credit_limit != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Limit</span>
                            <span className="font-medium">
                              {formatCurrency(
                                Number(account.credit_limit),
                                currency
                              )}
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
                            <span className="text-muted-foreground">
                              Available
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(
                                Number(account.credit_limit) -
                                  Number(account.debt),
                                currency
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {account.type === "debit_card" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Linked to</span>
                        <span className="font-medium">
                          {linkedBank
                            ? `${linkedBank.icon} ${linkedBank.name}`
                            : "—"}
                        </span>
                      </div>
                    )}

                    {(account.type === "bank" || account.type === "cash") && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(Number(account.balance), currency)}
                          </span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Net</span>
                          <span
                            className={`font-semibold ${Number(account.balance) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(Number(account.balance), currency)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
              <DialogDescription>
                Add a bank account, cash, debit card, or credit card.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <AccountFormFields
                form={createForm}
                onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
                iconPickerOpen={iconOpen}
                setIconPickerOpen={setIconOpen}
                bankAccounts={bankAccounts}
              />
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
              <AccountFormFields
                form={editForm}
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                iconPickerOpen={editIconOpen}
                setIconPickerOpen={setEditIconOpen}
                bankAccounts={bankAccounts}
              />
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
