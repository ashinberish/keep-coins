import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { configApi, type AppConfig } from "@/services/config"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const FEATURE_LABELS: Record<string, string> = {
  "feature.transactions": "Transactions",
  "feature.accounts": "Accounts",
  "feature.summary": "Summary",
  "feature.emis": "EMIs",
  "feature.groups": "Groups",
}

const SYSTEM_LABELS: Record<string, { label: string; description: string }> = {
  "signup.enabled": {
    label: "Allow new signups",
    description: "When disabled, no new users can register",
  },
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    configApi
      .list()
      .then(({ data }) => setConfigs(data))
      .catch(() => toast.error("Failed to load configuration"))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (config: AppConfig) => {
    const newValue = config.value === "true" ? "false" : "true"
    try {
      const { data } = await configApi.update(config.id, newValue)
      setConfigs((prev) => prev.map((c) => (c.id === data.id ? data : c)))
      const label =
        FEATURE_LABELS[config.key] ??
        SYSTEM_LABELS[config.key]?.label ??
        config.key
      toast.success(`${label} ${newValue === "true" ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Failed to update configuration")
    }
  }

  const featureConfigs = configs.filter((c) => c.key.startsWith("feature."))
  const systemConfigs = configs.filter((c) =>
    Object.keys(SYSTEM_LABELS).includes(c.key)
  )

  // Sidebar button configs
  const sbConfigs = configs.filter((c) => c.key.startsWith("sidebar_button."))
  const sbMap: Record<string, AppConfig> = {}
  sbConfigs.forEach((c) => {
    sbMap[c.key] = c
  })

  const sbEnabled = sbMap["sidebar_button.enabled"]?.value === "true"
  const [sbLabel, setSbLabel] = useState("")
  const [sbUrl, setSbUrl] = useState("")
  const [sbVariant, setSbVariant] = useState("outline")
  const [sbSaving, setSbSaving] = useState(false)

  useEffect(() => {
    const map: Record<string, AppConfig> = {}
    configs
      .filter((c) => c.key.startsWith("sidebar_button."))
      .forEach((c) => {
        map[c.key] = c
      })
    setSbLabel(map["sidebar_button.label"]?.value ?? "")
    setSbUrl(map["sidebar_button.url"]?.value ?? "")
    setSbVariant(map["sidebar_button.variant"]?.value ?? "outline")
  }, [configs])

  const handleSbSave = async () => {
    setSbSaving(true)
    try {
      const updates = [
        { id: sbMap["sidebar_button.label"]?.id, value: sbLabel },
        { id: sbMap["sidebar_button.url"]?.id, value: sbUrl },
        { id: sbMap["sidebar_button.variant"]?.id, value: sbVariant },
      ].filter((u) => u.id != null)
      for (const { id, value } of updates) {
        const { data } = await configApi.update(id!, value)
        setConfigs((prev) => prev.map((c) => (c.id === data.id ? data : c)))
      }
      toast.success("Sidebar button updated")
    } catch {
      toast.error("Failed to save sidebar button")
    } finally {
      setSbSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Registration */}
      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
        </CardHeader>
        <CardContent>
          {systemConfigs.map((config) => (
            <div key={config.id} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  {SYSTEM_LABELS[config.key]?.label ?? config.key}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {SYSTEM_LABELS[config.key]?.description ?? config.description}
                </p>
              </div>
              <Switch
                checked={config.value === "true"}
                onCheckedChange={() => handleToggle(config)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Tabs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {featureConfigs.map((config, i) => (
            <div key={config.id}>
              <div className="flex items-center justify-between py-2.5">
                <Label className="text-sm">
                  {FEATURE_LABELS[config.key] ?? config.key}
                </Label>
                <Switch
                  checked={config.value === "true"}
                  onCheckedChange={() => handleToggle(config)}
                />
              </div>
              {i < featureConfigs.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sidebar Button */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show button</Label>
              <p className="text-xs text-muted-foreground">
                Display a customizable button in the sidebar
              </p>
            </div>
            <Switch
              checked={sbEnabled}
              onCheckedChange={() => {
                if (sbMap["sidebar_button.enabled"]) {
                  handleToggle(sbMap["sidebar_button.enabled"])
                }
              }}
            />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label className="text-sm">Label</Label>
              <Input
                value={sbLabel}
                onChange={(e) => setSbLabel(e.target.value)}
                placeholder="e.g. Give Feedback"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm">URL</Label>
              <Input
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm">Style</Label>
              <Select
                value={sbVariant}
                onValueChange={(v) => {
                  if (v) setSbVariant(v)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Filled</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleSbSave} disabled={sbSaving}>
              {sbSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
