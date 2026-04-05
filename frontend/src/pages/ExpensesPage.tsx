import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { currencySymbol } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { categoriesApi, type Category } from "@/services/categories"
import { expensesApi, type Expense, type QuickStats } from "@/services/expenses"
import {
  paymentMethodsApi,
  type PaymentMethod,
} from "@/services/payment-methods"
import { useAuthStore } from "@/store/auth"
import { format } from "date-fns"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")
  const defaultPmId = useAuthStore(
    (s) => s.user?.default_payment_method_id ?? null
  )

  // pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "year" | "custom"
  >("today")

  // custom date range
  const [rangeFrom, setRangeFrom] = useState<Date | undefined>(undefined)
  const [rangeTo, setRangeTo] = useState<Date | undefined>(undefined)

  // quick stats
  const [stats, setStats] = useState<QuickStats | null>(null)

  // form state
  const [amount, setAmount] = useState("")
  const [txnType, setTxnType] = useState<"expense" | "income">("expense")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [submitting, setSubmitting] = useState(false)

  async function fetchExpenses(
    p: number,
    per = period,
    from?: Date,
    to?: Date
  ) {
    try {
      const df =
        per === "custom" && from ? format(from, "yyyy-MM-dd") : undefined
      const dt = per === "custom" && to ? format(to, "yyyy-MM-dd") : undefined
      const { data } = await expensesApi.list(p, PAGE_SIZE, per, df, dt)
      setExpenses(data.items)
      setTotalPages(data.total_pages)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      toast.error("Failed to load expenses")
    }
  }

  async function fetchStats() {
    try {
      const { data } = await expensesApi.quickStats()
      setStats(data)
    } catch {
      /* silent */
    }
  }

  async function fetchData() {
    try {
      const [expRes, catRes, pmRes] = await Promise.all([
        expensesApi.list(1, PAGE_SIZE, period),
        categoriesApi.list(),
        paymentMethodsApi.list(),
        fetchStats(),
      ])
      setExpenses(expRes.data.items)
      setTotalPages(expRes.data.total_pages)
      setTotal(expRes.data.total)
      setPage(expRes.data.page)
      setCategories(catRes.data)
      setPaymentMethods(pmRes.data)
      if (!categoryId && catRes.data.length > 0) {
        setCategoryId(catRes.data[0].id)
      }
      if (!paymentMethodId && defaultPmId) {
        setPaymentMethodId(defaultPmId)
      }
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (period !== "custom") {
      fetchExpenses(1, period)
    }
  }, [period])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || !categoryId || !date) return
    setSubmitting(true)
    try {
      await expensesApi.create({
        amount: parseFloat(amount),
        type: txnType,
        category_id: categoryId,
        description: description || undefined,
        date: format(date, "yyyy-MM-dd"),
        payment_method_id: paymentMethodId || undefined,
      })
      toast.success(txnType === "income" ? "Income added" : "Expense added")
      setAmount("")
      setTxnType("expense")
      setDescription("")
      setCategoryId(categories.length > 0 ? categories[0].id : null)
      setPaymentMethodId(defaultPmId)
      setDate(new Date())
      await Promise.all([fetchExpenses(1), fetchStats()])
    } catch {
      toast.error("Failed to add expense")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await expensesApi.delete(id)
      toast.success("Expense deleted")
      await Promise.all([fetchExpenses(page), fetchStats()])
    } catch {
      toast.error("Failed to delete expense")
    }
  }

  // edit sheet state
  const [editOpen, setEditOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editType, setEditType] = useState<"expense" | "income">("expense")
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [editPmId, setEditPmId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState("")
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [editSubmitting, setEditSubmitting] = useState(false)

  function openEdit(exp: Expense) {
    setEditExpense(exp)
    setEditAmount(parseFloat(exp.amount).toString())
    setEditType(exp.type)
    setEditCategoryId(exp.category_id)
    setEditPmId(exp.payment_method_id)
    setEditDescription(exp.description ?? "")
    setEditDate(new Date(exp.date + "T00:00:00"))
    setEditOpen(true)
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editExpense || !editAmount || !editCategoryId || !editDate) return
    setEditSubmitting(true)
    try {
      await expensesApi.update(editExpense.id, {
        amount: parseFloat(editAmount),
        type: editType,
        category_id: editCategoryId,
        description: editDescription || undefined,
        date: format(editDate, "yyyy-MM-dd"),
        payment_method_id: editPmId || undefined,
      })
      toast.success("Expense updated")
      setEditOpen(false)
      await Promise.all([
        fetchExpenses(page, period, rangeFrom, rangeTo),
        fetchStats(),
      ])
    } catch {
      toast.error("Failed to update expense")
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type toggle */}
            <div className="flex items-center justify-center">
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    txnType === "expense"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setTxnType("expense")}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    txnType === "income"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setTxnType("income")}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Amount — hero input */}
            <div className="flex items-center justify-center gap-1 py-4">
              <span className="font-mono text-4xl font-light text-muted-foreground">
                {currencySymbol(currency)}
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v)
                }}
                className="w-48 border-none bg-transparent text-center font-mono text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
                required
                autoFocus
              />
            </div>

            {/* Secondary fields row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Category
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category">
                      {categoryId
                        ? (() => {
                            const cat = categories.find(
                              (c) => c.id === categoryId
                            )
                            return cat ? `${cat.emoji} ${cat.name}` : null
                          })()
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="mr-2">{c.emoji}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Description
                </Label>
                <Input
                  placeholder="What was it for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Payment Method
                </Label>
                <Select
                  value={paymentMethodId}
                  onValueChange={setPaymentMethodId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None">
                      {paymentMethodId
                        ? (() => {
                            const pm = paymentMethods.find(
                              (p) => p.id === paymentMethodId
                            )
                            return pm ? `${pm.icon} ${pm.name}` : null
                          })()
                        : "None"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        <span className="mr-2">{pm.icon}</span>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  &nbsp;
                </Label>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !amount || !categoryId}
                >
                  {submitting
                    ? "Adding…"
                    : txnType === "income"
                      ? "Add Income"
                      : "Add Expense"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {currencySymbol(currency)}
                {stats.today_total.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {currencySymbol(currency)}
                {stats.month_total.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {period === "custom" && rangeFrom && rangeTo
              ? `${format(rangeFrom, "MMM d")} — ${format(rangeTo, "MMM d, yyyy")}`
              : period === "today"
                ? "Today"
                : period === "week"
                  ? "This Week"
                  : period === "month"
                    ? "This Month"
                    : "This Year"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["today", "week", "month", "year"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPeriod(p)
                    setRangeFrom(undefined)
                    setRangeTo(undefined)
                  }}
                  className="text-xs capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={period === "custom" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  />
                }
              >
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                Range
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={
                    rangeFrom && rangeTo
                      ? { from: rangeFrom, to: rangeTo }
                      : undefined
                  }
                  onSelect={(range) => {
                    if (range?.from) setRangeFrom(range.from)
                    if (range?.to) setRangeTo(range.to)
                    if (range?.from && range?.to) {
                      setPeriod("custom")
                      fetchExpenses(1, "custom", range.from, range.to)
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No expenses found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No expenses for this period. Try a different range or add one
                above.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            expense.type === "income"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}
                        >
                          {expense.type === "income" ? "Income" : "Expense"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cat = categories.find(
                            (c) => c.id === expense.category_id
                          )
                          return cat
                            ? `${cat.emoji} ${cat.name}`
                            : (expense.category_name ?? "—")
                        })()}
                      </TableCell>
                      <TableCell>{expense.description ?? "—"}</TableCell>
                      <TableCell>
                        {expense.payment_method_name ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono font-medium tabular-nums",
                          expense.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : ""
                        )}
                      >
                        {expense.type === "income" ? "+" : "-"}
                        {currencySymbol(currency)}
                        {parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() =>
                        fetchExpenses(page - 1, period, rangeFrom, rangeTo)
                      }
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        fetchExpenses(page + 1, period, rangeFrom, rangeTo)
                      }
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>
              Update the details below and save.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleEditSubmit}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          >
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    editType === "expense"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setEditType("expense")}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    editType === "income"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setEditType("income")}
                >
                  Income
                </button>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Amount</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={editAmount}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setEditAmount(v)
                }}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category">
                    {editCategoryId
                      ? (() => {
                          const cat = categories.find(
                            (c) => c.id === editCategoryId
                          )
                          return cat ? `${cat.emoji} ${cat.name}` : null
                        })()
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="mr-2">{c.emoji}</span>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal",
                        !editDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDate ? format(editDate, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input
                placeholder="What was it for?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Payment Method</Label>
              <Select value={editPmId} onValueChange={setEditPmId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {editPmId
                      ? (() => {
                          const pm = paymentMethods.find(
                            (p) => p.id === editPmId
                          )
                          return pm ? `${pm.icon} ${pm.name}` : null
                        })()
                      : "None"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      <span className="mr-2">{pm.icon}</span>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SheetFooter>
              <Button
                type="submit"
                disabled={editSubmitting || !editAmount || !editCategoryId}
              >
                {editSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
