import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES } from "@/lib/currency"
import {
  accountsApi,
  type AccountType,
  type CreateAccountPayload,
} from "@/services/accounts"
import {
  categoriesApi,
  type Category,
  type CreateCategoryPayload,
} from "@/services/categories"
import { useAuthStore } from "@/store/auth"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "bank", label: "Bank Account", icon: "🏦" },
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "credit_card", label: "Credit Card", icon: "💳" },
]

const STEPS = ["Currency", "Categories", "Accounts"] as const

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setCurrency, completeOnboarding } = useAuthStore()
  const [step, setStep] = useState(0)
  const [finishing, setFinishing] = useState(false)

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(
    user?.currency ?? "USD"
  )

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState("")
  const [newCatEmoji, setNewCatEmoji] = useState("📦")
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense")
  const [catLoading, setCatLoading] = useState(false)

  // Accounts state
  const [accounts, setAccounts] = useState<
    { id?: string; name: string; icon: string; type: AccountType }[]
  >([])
  const [newAccName, setNewAccName] = useState("")
  const [newAccIcon, setNewAccIcon] = useState("🏦")
  const [newAccType, setNewAccType] = useState<AccountType>("bank")
  const [accLoading, setAccLoading] = useState(false)

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data))
    accountsApi.list().then(({ data }) =>
      setAccounts(
        data.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          type: a.type,
        }))
      )
    )
  }, [])

  async function handleCurrencyNext() {
    try {
      await setCurrency(selectedCurrency)
      setStep(1)
    } catch {
      toast.error("Failed to update currency")
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setCatLoading(true)
    try {
      const payload: CreateCategoryPayload = {
        name: newCatName.trim(),
        emoji: newCatEmoji,
        category_type: newCatType,
      }
      const { data } = await categoriesApi.create(payload)
      setCategories((prev) => [...prev, data])
      setNewCatName("")
      setNewCatEmoji("📦")
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to add category")
    } finally {
      setCatLoading(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await categoriesApi.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to delete category")
    }
  }

  async function handleAddAccount() {
    if (!newAccName.trim()) return
    setAccLoading(true)
    try {
      const payload: CreateAccountPayload = {
        name: newAccName.trim(),
        icon: newAccIcon,
        type: newAccType,
      }
      const { data } = await accountsApi.create(payload)
      setAccounts((prev) => [
        ...prev,
        { id: data.id, name: data.name, icon: data.icon, type: data.type },
      ])
      setNewAccName("")
      setNewAccIcon("🏦")
      setNewAccType("bank")
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to add account")
    } finally {
      setAccLoading(false)
    }
  }

  async function handleDeleteAccount(id: string) {
    try {
      await accountsApi.delete(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to delete account")
    }
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      await completeOnboarding()
      toast.success("You're all set!")
      navigate("/", { replace: true })
    } catch {
      toast.error("Something went wrong")
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to KeepCoins
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let's set up your account in a few quick steps
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-6 bg-border sm:w-10" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Currency */}
      {step === 0 && (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Choose your currency</CardTitle>
            <CardDescription>
              This will be used as the default currency for all your
              transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CURRENCIES.map((cur) => {
                const Icon = cur.icon
                const isSelected = selectedCurrency === cur.code
                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setSelectedCurrency(cur.code)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div>
                      <div className="font-medium">{cur.code}</div>
                      <div className="text-xs text-muted-foreground">
                        {cur.symbol}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" onClick={handleCurrencyNext}>
              Next <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Categories */}
      {step === 1 && (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set up categories</CardTitle>
            <CardDescription>
              You already have default categories. Add your own custom ones
              below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing categories */}
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <span>
                    {cat.emoji} {cat.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {cat.category_type}
                    </span>
                  </span>
                  {cat.user_id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new category */}
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Add category</p>
              <div className="flex gap-2">
                <Input
                  className="w-16 text-center"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  maxLength={2}
                />
                <Input
                  className="flex-1"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={newCatType}
                  items={[
                    { value: "expense", label: "Expense" },
                    { value: "income", label: "Income" },
                  ]}
                  onValueChange={(v) =>
                    setNewCatType(v as "expense" | "income")
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense" label="Expense">
                      Expense
                    </SelectItem>
                    <SelectItem value="income" label="Income">
                      Income
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={catLoading || !newCatName.trim()}
                >
                  {catLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)}>
              Next <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Accounts */}
      {step === 2 && (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set up accounts</CardTitle>
            <CardDescription>
              You have a default Cash account. Add your bank accounts and cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing accounts */}
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {accounts.map((acc) => (
                <div
                  key={acc.id ?? acc.name}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <span>
                    {acc.icon} {acc.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {acc.type.replace("_", " ")}
                    </span>
                  </span>
                  {acc.id && accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id!)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new account */}
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Add account</p>
              <div className="flex gap-2">
                <Input
                  className="w-16 text-center"
                  value={newAccIcon}
                  onChange={(e) => setNewAccIcon(e.target.value)}
                  maxLength={2}
                />
                <Input
                  className="flex-1"
                  placeholder="Account name"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={newAccType}
                  items={ACCOUNT_TYPES.map((t) => ({
                    value: t.value,
                    label: `${t.icon} ${t.label}`,
                  }))}
                  onValueChange={(v) => {
                    setNewAccType(v as AccountType)
                    const match = ACCOUNT_TYPES.find((t) => t.value === v)
                    if (match) setNewAccIcon(match.icon)
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        label={`${t.icon} ${t.label}`}
                      >
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddAccount}
                  disabled={accLoading || !newAccName.trim()}
                >
                  {accLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
            <Button onClick={handleFinish} disabled={finishing}>
              {finishing ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Check className="mr-1 size-4" />
              )}
              Finish setup
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
