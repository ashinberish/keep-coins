import {
  BadgeDollarSign,
  BadgeEuro,
  BadgeIndianRupee,
  BadgeJapaneseYen,
  BadgePoundSterling,
  BadgeSwissFranc,
  Coins,
  type LucideIcon,
} from "lucide-react"

export const CURRENCIES = [
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    icon: BadgeDollarSign,
    locale: "en-US",
  },
  { code: "EUR", symbol: "€", name: "Euro", icon: BadgeEuro, locale: "de-DE" },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    icon: BadgePoundSterling,
    locale: "en-GB",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    icon: BadgeJapaneseYen,
    locale: "ja-JP",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    icon: BadgeIndianRupee,
    locale: "en-IN",
  },
  {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    icon: BadgeDollarSign,
    locale: "en-CA",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    icon: BadgeDollarSign,
    locale: "en-AU",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    icon: BadgeSwissFranc,
    locale: "de-CH",
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    icon: BadgeJapaneseYen,
    locale: "zh-CN",
  },
  {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    icon: Coins,
    locale: "ko-KR",
  },
  {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    icon: Coins,
    locale: "pt-BR",
  },
  {
    code: "MXN",
    symbol: "MX$",
    name: "Mexican Peso",
    icon: Coins,
    locale: "es-MX",
  },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}

export function currencyIcon(code: string): LucideIcon {
  return CURRENCIES.find((c) => c.code === code)?.icon ?? Coins
}

/** Format a number with locale-aware grouping (commas / periods) and 2 decimals, prefixed with the currency symbol. */
export function formatCurrency(amount: number, code: string): string {
  const cur = CURRENCIES.find((c) => c.code === code)
  const locale = cur?.locale ?? "en-US"
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${cur?.symbol ?? code}${formatted}`
}

/** Format a number with locale-aware grouping and 2 decimals, WITHOUT the currency symbol. */
export function formatAmount(amount: number, code: string): string {
  const locale = CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US"
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a raw numeric string with locale-aware thousand separators while
 * the user is still typing. Preserves trailing decimal point and partial
 * decimals (e.g. "1234." → "1,234.", "1234.5" → "1,234.5").
 * Returns `null` when the input is not a valid partial number so the
 * caller can reject the keystroke.
 */
export function formatInputAmount(raw: string, code: string): string | null {
  if (raw === "") return ""
  // Only allow digits, one dot, up to 2 decimal places
  if (!/^\d*\.?\d{0,2}$/.test(raw)) return null

  const locale = CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US"

  const endsWithDot = raw.endsWith(".")
  const parts = raw.split(".")
  const intPart = parts[0]

  // Format the integer part with grouping
  const formattedInt = intPart
    ? new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(BigInt(intPart))
    : ""

  if (endsWithDot) return `${formattedInt}.`
  if (parts.length === 2) return `${formattedInt}.${parts[1]}`
  return formattedInt
}

/** Strip thousand-separator characters to recover the raw numeric string. */
export function stripFormatting(formatted: string, code: string): string {
  const locale = CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US"
  const sep = new Intl.NumberFormat(locale).format(1111).replace(/1/g, "")
  // Remove all grouping separators
  return formatted.split(sep).join("")
}
