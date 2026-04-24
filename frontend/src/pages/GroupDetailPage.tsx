import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/currency"
import {
  groupsApi,
  type BalanceEntry,
  type Group,
  type GroupExpense,
  type Settlement,
} from "@/services/groups"
import { useAuthStore } from "@/store/auth"
import axios from "axios"
import {
  ArrowLeft,
  Crown,
  HandCoins,
  Plus,
  Receipt,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) return err.response?.data?.detail ?? fallback
  return fallback
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currency = user?.currency ?? "USD"

  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [balances, setBalances] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Add expense
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expAmount, setExpAmount] = useState("")
  const [expDesc, setExpDesc] = useState("")
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10))
  const [expSplitType, setExpSplitType] = useState("equal")

  // Add member
  const [memberOpen, setMemberOpen] = useState(false)
  const [memberUsername, setMemberUsername] = useState("")

  // Settle up
  const [settleOpen, setSettleOpen] = useState(false)
  const [settleTo, setSettleTo] = useState("")
  const [settleAmount, setSettleAmount] = useState("")
  const [settleDate, setSettleDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const isAdmin = group?.members.some(
    (m) => m.user_id === user?.id && m.role === "admin"
  )

  const loadAll = async () => {
    if (!groupId) return
    try {
      const [gRes, eRes, sRes, bRes] = await Promise.all([
        groupsApi.get(groupId),
        groupsApi.listExpenses(groupId),
        groupsApi.listSettlements(groupId),
        groupsApi.getBalances(groupId),
      ])
      setGroup(gRes.data)
      setExpenses(eRes.data)
      setSettlements(sRes.data)
      setBalances(bRes.data)
    } catch {
      toast.error("Failed to load group")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [groupId])

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId || !expAmount || !expDesc) return
    try {
      await groupsApi.createExpense(groupId, {
        amount: parseFloat(expAmount),
        description: expDesc,
        date: expDate,
        split_type: expSplitType,
      })
      toast.success("Expense added")
      setExpenseOpen(false)
      setExpAmount("")
      setExpDesc("")
      setExpSplitType("equal")
      loadAll()
    } catch {
      toast.error("Failed to add expense")
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!groupId) return
    try {
      await groupsApi.deleteExpense(groupId, expenseId)
      toast.success("Expense deleted")
      loadAll()
    } catch {
      toast.error("Failed to delete expense")
    }
  }

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId || !memberUsername.trim()) return
    try {
      await groupsApi.addMember(groupId, memberUsername.trim())
      toast.success("Member added")
      setMemberOpen(false)
      setMemberUsername("")
      loadAll()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to add member"))
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!groupId) return
    try {
      await groupsApi.removeMember(groupId, userId)
      toast.success("Member removed")
      loadAll()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove member"))
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!groupId) return
    const newRole = currentRole === "admin" ? "member" : "admin"
    try {
      await groupsApi.updateMemberRole(groupId, userId, newRole)
      toast.success("Role updated")
      loadAll()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update role"))
    }
  }

  const handleSettle = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId || !settleTo || !settleAmount) return
    try {
      await groupsApi.createSettlement(groupId, {
        paid_to: settleTo,
        amount: parseFloat(settleAmount),
        date: settleDate,
      })
      toast.success("Settlement recorded")
      setSettleOpen(false)
      setSettleTo("")
      setSettleAmount("")
      loadAll()
    } catch {
      toast.error("Failed to record settlement")
    }
  }

  const handleDeleteSettlement = async (settlementId: string) => {
    if (!groupId) return
    try {
      await groupsApi.deleteSettlement(groupId, settlementId)
      toast.success("Settlement deleted")
      loadAll()
    } catch {
      toast.error("Failed to delete settlement")
    }
  }

  if (loading || !group) return null

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-2xl">{group.icon}</span>
        <div>
          <h2 className="text-lg font-semibold">{group.name}</h2>
          {group.description && (
            <p className="text-xs text-muted-foreground">{group.description}</p>
          )}
        </div>
      </div>

      {/* Balance summary cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {balances.map((b) => (
            <Card key={b.user_id} className="p-3">
              <p className="truncate text-xs text-muted-foreground">
                {b.username}
              </p>
              <p
                className={`text-sm font-semibold ${
                  b.balance > 0
                    ? "text-green-600"
                    : b.balance < 0
                      ? "text-red-600"
                      : ""
                }`}
              >
                {b.balance > 0 ? "+" : ""}
                {formatCurrency(b.balance, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {b.balance > 0
                  ? "gets back"
                  : b.balance < 0
                    ? "owes"
                    : "settled"}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="expenses">
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">
            <Receipt className="mr-1 h-3.5 w-3.5" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            <Users className="mr-1 h-3.5 w-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settlements" className="flex-1">
            <HandCoins className="mr-1 h-3.5 w-3.5" />
            Settle
          </TabsTrigger>
        </TabsList>

        {/* ── Expenses Tab ──────────────────────────────── */}
        <TabsContent value="expenses" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setExpenseOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No expenses yet
            </p>
          ) : (
            expenses.map((exp) => (
              <Card key={exp.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid by{" "}
                        <span className="font-medium">
                          {exp.paid_by === user?.id
                            ? "You"
                            : exp.paid_by_username}
                        </span>{" "}
                        · {exp.date}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(exp.amount, currency)}
                      </p>
                    </div>
                    {(exp.paid_by === user?.id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteExpense(exp.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {exp.splits.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        {exp.splits.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {s.user_id === user?.id ? "You" : s.username}
                            </span>
                            <span>{formatCurrency(s.amount, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Members Tab ───────────────────────────────── */}
        <TabsContent value="members" className="space-y-3">
          {isAdmin && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setMemberOpen(true)}>
                <UserPlus className="mr-1 h-4 w-4" />
                Add Member
              </Button>
            </div>
          )}

          {group.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {m.username}
                  {m.user_id === user?.id && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </span>
                {m.role === "admin" && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Crown className="mr-0.5 h-2.5 w-2.5" />
                    Admin
                  </Badge>
                )}
              </div>
              {isAdmin && m.user_id !== user?.id && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleToggleRole(m.user_id, m.role)}
                  >
                    {m.role === "admin" ? "Demote" : "Promote"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemoveMember(m.user_id)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* ── Settlements Tab ───────────────────────────── */}
        <TabsContent value="settlements" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setSettleOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Settle Up
            </Button>
          </div>

          {settlements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No settlements yet
            </p>
          ) : (
            settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">
                      {s.paid_by === user?.id ? "You" : s.paid_by_username}
                    </span>
                    {" → "}
                    <span className="font-medium">
                      {s.paid_to === user?.id ? "You" : s.paid_to_username}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(s.amount, currency)}
                  </span>
                  {(s.paid_by === user?.id || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteSettlement(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Expense Dialog ──────────────────────────── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <form onSubmit={handleAddExpense}>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Dinner, Taxi, etc."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Split</Label>
                <Select
                  value={expSplitType}
                  items={[{ value: "equal", label: "Split Equally" }]}
                  onValueChange={(v) => setExpSplitType(v ?? "equal")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal" label="Split Equally">
                      Split Equally
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ──────────────────────────── */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input
                  value={memberUsername}
                  onChange={(e) => setMemberUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Settle Up Dialog ───────────────────────────── */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent>
          <form onSubmit={handleSettle}>
            <DialogHeader>
              <DialogTitle>Settle Up</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Pay To</Label>
                <Select
                  value={settleTo}
                  items={group.members
                    .filter((m) => m.user_id !== user?.id)
                    .map((m) => ({ value: m.user_id, label: m.username }))}
                  onValueChange={(v) => setSettleTo(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {group.members
                      .filter((m) => m.user_id !== user?.id)
                      .map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
