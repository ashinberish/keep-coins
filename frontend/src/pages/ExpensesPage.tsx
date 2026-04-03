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
import { expensesApi, type Expense } from "@/services/expenses"
import { useAuthStore } from "@/store/auth"
import { format } from "date-fns"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Trash2,
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")

  // pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  // form state
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [submitting, setSubmitting] = useState(false)

  async function fetchExpenses(p: number) {
    try {
      const { data } = await expensesApi.list(p, PAGE_SIZE)
      setExpenses(data.items)
      setTotalPages(data.total_pages)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      toast.error("Failed to load expenses")
    }
  }

  async function fetchData() {
    try {
      const [expRes, catRes] = await Promise.all([
        expensesApi.list(1, PAGE_SIZE),
        categoriesApi.list(),
      ])
      setExpenses(expRes.data.items)
      setTotalPages(expRes.data.total_pages)
      setTotal(expRes.data.total)
      setPage(expRes.data.page)
      setCategories(catRes.data)
      if (!categoryId && catRes.data.length > 0) {
        setCategoryId(catRes.data[0].id)
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || !categoryId || !date) return
    setSubmitting(true)
    try {
      await expensesApi.create({
        amount: parseFloat(amount),
        category_id: categoryId,
        description: description || undefined,
        date: format(date, "yyyy-MM-dd"),
      })
      toast.success("Expense added")
      setAmount("")
      setDescription("")
      setCategoryId(categories.length > 0 ? categories[0].id : null)
      setDate(new Date())
      await fetchExpenses(1)
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
      await fetchExpenses(page)
    } catch {
      toast.error("Failed to delete expense")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                  &nbsp;
                </Label>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !amount || !categoryId}
                >
                  {submitting ? "Adding…" : "Add Expense"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No expenses yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first expense above to start tracking your spending.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
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
                      <TableCell className="text-right font-mono font-medium tabular-nums">
                        {currencySymbol(currency)}
                        {parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                      onClick={() => fetchExpenses(page - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => fetchExpenses(page + 1)}
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
    </div>
  )
}
