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
  { code: "USD", symbol: "$", name: "US Dollar", icon: BadgeDollarSign },
  { code: "EUR", symbol: "€", name: "Euro", icon: BadgeEuro },
  { code: "GBP", symbol: "£", name: "British Pound", icon: BadgePoundSterling },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", icon: BadgeJapaneseYen },
  { code: "INR", symbol: "₹", name: "Indian Rupee", icon: BadgeIndianRupee },
  {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    icon: BadgeDollarSign,
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    icon: BadgeDollarSign,
  },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", icon: BadgeSwissFranc },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", icon: BadgeJapaneseYen },
  { code: "KRW", symbol: "₩", name: "South Korean Won", icon: Coins },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", icon: Coins },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", icon: Coins },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}

export function currencyIcon(code: string): LucideIcon {
  return CURRENCIES.find((c) => c.code === code)?.icon ?? Coins
}

export function formatCurrency(amount: number, code: string): string {
  return `${currencySymbol(code)}${amount.toFixed(2)}`
}
