import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
      toast.success(
        `${FEATURE_LABELS[config.key] ?? config.key} ${newValue === "true" ? "enabled" : "disabled"}`
      )
    } catch {
      toast.error("Failed to update configuration")
    }
  }

  const featureConfigs = configs.filter((c) => c.key.startsWith("feature."))

  if (loading) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureConfigs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <Label className="text-sm font-medium">
                  {FEATURE_LABELS[config.key] ?? config.key}
                </Label>
                {config.description && (
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                )}
              </div>
              <Switch
                checked={config.value === "true"}
                onCheckedChange={() => handleToggle(config)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
