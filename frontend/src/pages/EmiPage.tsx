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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { currencySymbol, formatAmount } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { emisApi, type Emi, type Installment } from "@/services/emis"
import { useAuthStore } from "@/store/auth"
import { format } from "date-fns"
import {
  CalendarClock,
  CalendarIcon,
  Check,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

export default function EmiPage() {
  const [emis, setEmis] = useState<Emi[]>([])
  const [loading, setLoading] = useState(true)
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")
  const sym = currencySymbol(currency)

  // form
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [totalMonths, setTotalMonths] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [submitting, setSubmitting] = useState(false)

  // edit sheet state
  const [editOpen, setEditOpen] = useState(false)
  const [editEmi, setEditEmi] = useState<Emi | null>(null)
  const [editName, setEditName] = useState("")
  const [editInstallments, setEditInstallments] = useState<
    {
      id: string
      month_number: number
      due_date: string
      amount: string
      is_paid: boolean
    }[]
  >([])
  const [editSaving, setEditSaving] = useState(false)

  // summary stats
  const summary = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    let nextMonth = thisMonth + 1
    let nextYear = thisYear
    if (nextMonth > 11) {
      nextMonth = 0
      nextYear++
    }

    let thisMonthDue = 0
    let nextMonthDue = 0
    let totalDebt = 0

    for (const emi of emis) {
      for (const inst of emi.installments) {
        if (!inst.is_paid) {
          const due = new Date(inst.due_date + "T00:00:00")
          totalDebt += inst.amount
          if (due.getMonth() === thisMonth && due.getFullYear() === thisYear) {
            thisMonthDue += inst.amount
          }
          if (due.getMonth() === nextMonth && due.getFullYear() === nextYear) {
            nextMonthDue += inst.amount
          }
        }
      }
    }

    return { totalEmis: emis.length, thisMonthDue, nextMonthDue, totalDebt }
  }, [emis])

  async function fetchEmis() {
    try {
      const { data } = await emisApi.list()
      setEmis(data)
    } catch {
      toast.error("Failed to load EMIs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmis()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name || !monthlyAmount || !totalMonths || !startDate) return
    setSubmitting(true)
    try {
      await emisApi.create({
        name,
        monthly_amount: parseFloat(monthlyAmount),
        total_months: parseInt(totalMonths),
        start_date: format(startDate, "yyyy-MM-dd"),
      })
      toast.success("EMI added")
      setName("")
      setMonthlyAmount("")
      setTotalMonths("")
      setStartDate(new Date())
      setShowForm(false)
      await fetchEmis()
    } catch {
      toast.error("Failed to create EMI")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await emisApi.delete(id)
      toast.success("EMI deleted")
      await fetchEmis()
    } catch {
      toast.error("Failed to delete EMI")
    }
  }

  async function handleToggle(emi: Emi, inst: Installment) {
    try {
      const { data } = await emisApi.toggleInstallment(inst.id, !inst.is_paid)
      setEmis((prev) =>
        prev.map((e) =>
          e.id === emi.id
            ? {
                ...e,
                installments: e.installments.map((i) =>
                  i.id === inst.id ? { ...i, ...data } : i
                ),
              }
            : e
        )
      )
    } catch {
      toast.error("Failed to update")
    }
  }

  function openEdit(emi: Emi) {
    setEditEmi(emi)
    setEditName(emi.name)
    setEditInstallments(
      emi.installments.map((i) => ({
        id: i.id,
        month_number: i.month_number,
        due_date: i.due_date,
        amount: i.amount.toString(),
        is_paid: i.is_paid,
      }))
    )
    setEditOpen(true)
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault()
    if (!editEmi) return
    setEditSaving(true)
    try {
      // Update EMI name if changed
      if (editName !== editEmi.name) {
        await emisApi.update(editEmi.id, { name: editName })
      }
      // Update each installment amount if changed
      for (const inst of editInstallments) {
        const original = editEmi.installments.find((i) => i.id === inst.id)
        const newAmount = parseFloat(inst.amount)
        if (original && !isNaN(newAmount) && newAmount !== original.amount) {
          await emisApi.updateInstallment(inst.id, { amount: newAmount })
        }
      }
      toast.success("EMI updated")
      setEditOpen(false)
      await fetchEmis()
    } catch {
      toast.error("Failed to update EMI")
    } finally {
      setEditSaving(false)
    }
  }

  function emiProgress(emi: Emi) {
    const paid = emi.installments.filter((i) => i.is_paid).length
    return { paid, total: emi.total_months }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" />
          Add EMI
        </Button>
      </div>

      {/* Summary Cards */}
      {!loading && emis.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active EMIs</p>
                <p className="text-xl font-bold">{summary.totalEmis}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <CalendarClock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due This Month</p>
                <p className="text-xl font-bold">
                  {sym}
                  {formatAmount(summary.thisMonthDue, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Next Month</p>
                <p className="text-xl font-bold">
                  {sym}
                  {formatAmount(summary.nextMonthDue, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-red-500/10 p-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Debt</p>
                <p className="text-xl font-bold">
                  {sym}
                  {formatAmount(summary.totalDebt, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 gap-4 sm:grid-cols-5"
            >
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Name
                </Label>
                <Input
                  placeholder="e.g. Car Loan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Monthly Amount
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Months
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={360}
                  placeholder="12"
                  value={totalMonths}
                  onChange={(e) => setTotalMonths(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM yyyy") : "Pick"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                  &nbsp;
                </Label>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* EMI List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : emis.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Landmark className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No EMIs yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first EMI to start tracking installments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        emis.map((emi) => {
          const { paid, total } = emiProgress(emi)
          const paidAmount = emi.installments
            .filter((i) => i.is_paid)
            .reduce((s, i) => s + i.amount, 0)
          const totalAmount = emi.installments.reduce((s, i) => s + i.amount, 0)

          return (
            <Card key={emi.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{emi.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sym}
                    {formatAmount(emi.monthly_amount, currency)}/mo · {paid}/
                    {total} paid · {sym}
                    {formatAmount(paidAmount, currency)} of {sym}
                    {formatAmount(totalAmount, currency)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(emi)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(emi.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Timeline grid */}
                <div className="flex flex-wrap gap-2">
                  {emi.installments.map((inst) => {
                    const due = new Date(inst.due_date + "T00:00:00")

                    return (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => handleToggle(emi, inst)}
                        title="Click to toggle paid"
                        className={cn(
                          "flex h-16 w-20 flex-col items-center justify-center rounded-lg border-2 text-xs font-medium transition-all",
                          "hover:scale-105 hover:shadow-md",
                          inst.is_paid
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        )}
                      >
                        {inst.is_paid ? (
                          <Check className="mb-0.5 h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <span className="mb-0.5 text-[10px] text-muted-foreground">
                            {format(due, "MMM")}
                          </span>
                        )}
                        <span className="font-mono text-xs font-semibold tabular-nums">
                          {sym}
                          {inst.amount.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {inst.is_paid ? "Paid" : format(due, "yyyy")}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${total > 0 ? (paid / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Edit EMI Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit EMI</SheetTitle>
            <SheetDescription>
              Update the EMI name and individual installment amounts.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleEditSave}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          >
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Installments</Label>
              <div className="space-y-2">
                {editInstallments.map((inst, idx) => {
                  const due = new Date(inst.due_date + "T00:00:00")
                  return (
                    <div key={inst.id} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-muted-foreground">
                        #{inst.month_number} · {format(due, "MMM yyyy")}
                      </span>
                      {inst.is_paid ? (
                        <div className="flex h-9 flex-1 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                          <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                          {sym}
                          {parseFloat(inst.amount).toFixed(2)} (Paid)
                        </div>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={inst.amount}
                          onChange={(e) =>
                            setEditInstallments((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, amount: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="flex-1"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={editSaving || !editName.trim()}>
                {editSaving ? "Saving…" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
