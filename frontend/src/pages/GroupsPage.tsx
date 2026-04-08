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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { groupsApi, type Group } from "@/services/groups"
import { Plus, Users } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

const ICON_OPTIONS = [
  "👥",
  "🏠",
  "✈️",
  "🍕",
  "🎉",
  "💼",
  "🏖️",
  "🎮",
  "🛒",
  "❤️",
]

export default function GroupsPage() {
  const navigate = useNavigate()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("👥")
  const [iconOpen, setIconOpen] = useState(false)

  const load = () => {
    groupsApi
      .list()
      .then(({ data }) => setGroups(data))
      .catch(() => toast.error("Failed to load groups"))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await groupsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      })
      toast.success("Group created")
      setCreateOpen(false)
      setName("")
      setDescription("")
      setIcon("👥")
      load()
    } catch {
      toast.error("Failed to create group")
    }
  }

  if (loading) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Groups</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No groups yet. Create one to start splitting expenses!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <span className="text-2xl">{group.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {group.members.length} member
                    {group.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Icon</Label>
                <Popover open={iconOpen} onOpenChange={setIconOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit text-lg"
                      />
                    }
                  >
                    {icon}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {ICON_OPTIONS.map((e) => (
                        <Button
                          key={e}
                          variant="ghost"
                          size="sm"
                          className="text-lg"
                          onClick={() => {
                            setIcon(e)
                            setIconOpen(false)
                          }}
                        >
                          {e}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Trip to Goa"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Weekend getaway expenses"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
