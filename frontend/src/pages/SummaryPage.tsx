import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { currencySymbol } from "@/lib/currency"
import { summaryApi, type MonthlySummary } from "@/services/summary"
import { useAuthStore } from "@/store/auth"
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Receipt,
  TrendingUp,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.65 0.15 210)",
  "oklch(0.65 0.15 160)",
  "oklch(0.65 0.15 30)",
  "oklch(0.65 0.15 280)",
  "oklch(0.65 0.15 0)",
]

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function SummaryPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlySummary | null>(null)
  const currency = useAuthStore((s) => s.user?.currency ?? "USD")
  const sym = currencySymbol(currency)
  const [loading, setLoading] = useState(true)

  async function fetchSummary(y: number, m: number) {
    setLoading(true)
    try {
      const res = await summaryApi.monthly(y, m)
      setData(res.data)
    } catch {
      toast.error("Failed to load summary")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(year, month)
  }, [year, month])

  function prevMonth() {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const pieConfig: ChartConfig = Object.fromEntries(
    (data?.by_category ?? []).map((c, i) => [
      c.name,
      { label: `${c.emoji} ${c.name}`, color: COLORS[i % COLORS.length] },
    ])
  )

  const barConfig: ChartConfig = {
    total: { label: "Amount", color: "var(--chart-1)" },
  }

  const avgPerDay =
    data && data.count > 0 ? data.total / new Date(year, month, 0).getDate() : 0

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : !data || data.count === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No data for this month</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add some expenses to see your monthly summary.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {sym}
                  {data.total.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transactions
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {data.count}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Daily Average
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {sym}
                  {avgPerDay.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Spending by category - Pie */}
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={pieConfig}
                  className="mx-auto aspect-square max-h-[280px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={data.by_category.map((c) => ({
                        name: c.name,
                        value: c.total,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {data.by_category.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {data.by_category.map((c, i) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>
                          {c.emoji} {c.name}
                        </span>
                      </div>
                      <span className="font-mono font-medium tabular-nums">
                        {sym}
                        {c.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily spending - Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={barConfig}
                  className="aspect-[4/3] max-h-[340px]"
                >
                  <BarChart data={data.daily}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v: string) => {
                        const d = new Date(v + "T00:00:00")
                        return d.getDate().toString()
                      }}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: number) => `${sym}${v}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="total"
                      fill="var(--color-total)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
