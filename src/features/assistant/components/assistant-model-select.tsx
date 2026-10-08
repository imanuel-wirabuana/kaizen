import { useState, useMemo } from "react"
import {
  Check,
  ChevronDown,
  Cpu,
  Search,
  Sparkles,
  Brain,
  Eye,
  FileText,
  Wrench,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useAiModels } from "@/features/assistant/hooks/use-ai-models"
import type { AiModel } from "@/types/assistant"
import { cn } from "@/lib/utils"

export interface AssistantModelSelectProps {
  modelName: string
  onModelChange: (model: string) => void | Promise<unknown>
  disabled?: boolean
  className?: string
}

export function AssistantModelSelect({
  modelName,
  onModelChange,
  disabled = false,
  className,
}: AssistantModelSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { models, currentModel } = useAiModels()

  // Categorize models for clean scanning
  const categorizedModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = models.filter((m) => {
      if (!q) return true
      return (
        m.id.toLowerCase().includes(q) ||
        (m.owned_by && m.owned_by.toLowerCase().includes(q))
      )
    })

    const recommendedIds = ["kaizen", "work", "alva"]
    const recommended: AiModel[] = []
    const claude: AiModel[] = []
    const gemini: AiModel[] = []
    const deepseek: AiModel[] = []
    const others: AiModel[] = []

    for (const m of filtered) {
      const lower = m.id.toLowerCase()
      if (recommendedIds.includes(lower)) {
        recommended.push(m)
      } else if (lower.includes("claude") || lower.includes("anthropic")) {
        claude.push(m)
      } else if (lower.includes("gemini") || lower.includes("google")) {
        gemini.push(m)
      } else if (lower.includes("deepseek") || lower.includes("reasoner")) {
        deepseek.push(m)
      } else {
        others.push(m)
      }
    }

    // Sort recommended so kaizen is first
    recommended.sort((a, b) => {
      const order = ["kaizen", "work", "alva"]
      return order.indexOf(a.id) - order.indexOf(b.id)
    })

    return {
      recommended,
      claude,
      gemini,
      deepseek,
      others,
      totalCount: filtered.length,
    }
  }, [models, search])

  const handleSelect = (id: string) => {
    onModelChange(id)
    setOpen(false)
    setSearch("")
  }

  // Format context length nicely
  const formatCtx = (ctx?: number) => {
    if (!ctx) return null
    if (ctx >= 1000000) return `${Math.round(ctx / 1000000)}M ctx`
    if (ctx >= 1000) return `${Math.round(ctx / 1000)}k ctx`
    return `${ctx} ctx`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-7 cursor-pointer gap-1.5 rounded-lg border-border/80 bg-background/80 px-2 text-xs font-normal text-muted-foreground shadow-2xs hover:bg-accent hover:text-foreground",
              open &&
                "border-primary/50 text-foreground ring-1 ring-primary/20",
              className
            )}
            title={`Active Model: ${modelName}`}
          />
        }
      >
        <Sparkles className="size-3 shrink-0 text-primary" />
        <span className="max-w-[120px] truncate font-medium text-foreground sm:max-w-[160px]">
          {modelName}
        </span>

        {/* Quick Capability Indicators on button */}
        {currentModel?.capabilities?.reasoning && (
          <span title="Reasoning / Thinking enabled" className="inline-flex">
            <Brain className="size-3 shrink-0 text-purple-500" />
          </span>
        )}
        {currentModel?.capabilities?.vision && (
          <span title="Vision enabled" className="inline-flex">
            <Eye className="size-3 shrink-0 text-blue-500" />
          </span>
        )}
        {currentModel?.capabilities?.search && (
          <span title="Web search grounded" className="inline-flex">
            <Globe className="size-3 shrink-0 text-emerald-500" />
          </span>
        )}

        <ChevronDown className="size-3 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="z-50 flex max-h-[380px] w-80 flex-col gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl sm:w-96"
      >
        {/* Search Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-popover px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models (e.g. kaizen, claude, gemini)..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="cursor-pointer px-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Scrollable Models List */}
        <div className="min-h-0 flex-1 divide-y divide-border/20 overflow-y-auto overscroll-contain p-1">
          {categorizedModels.totalCount === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching AI models found.
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {/* Recommended Group */}
              {categorizedModels.recommended.length > 0 && (
                <div>
                  <div className="sticky top-0 z-1 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                    ⭐ Recommended
                  </div>
                  <div className="space-y-0.5">
                    {categorizedModels.recommended.map((m) => (
                      <ModelOptionItem
                        key={m.id}
                        model={m}
                        isSelected={m.id === modelName}
                        onSelect={() => handleSelect(m.id)}
                        formatCtx={formatCtx}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Anthropic Claude */}
              {categorizedModels.claude.length > 0 && (
                <div>
                  <div className="sticky top-0 z-1 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                    Anthropic Claude
                  </div>
                  <div className="space-y-0.5">
                    {categorizedModels.claude.map((m) => (
                      <ModelOptionItem
                        key={m.id}
                        model={m}
                        isSelected={m.id === modelName}
                        onSelect={() => handleSelect(m.id)}
                        formatCtx={formatCtx}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Google Gemini */}
              {categorizedModels.gemini.length > 0 && (
                <div>
                  <div className="sticky top-0 z-1 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                    Google Gemini
                  </div>
                  <div className="space-y-0.5">
                    {categorizedModels.gemini.map((m) => (
                      <ModelOptionItem
                        key={m.id}
                        model={m}
                        isSelected={m.id === modelName}
                        onSelect={() => handleSelect(m.id)}
                        formatCtx={formatCtx}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* DeepSeek & Reasoning */}
              {categorizedModels.deepseek.length > 0 && (
                <div>
                  <div className="sticky top-0 z-1 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                    DeepSeek & Reasoning
                  </div>
                  <div className="space-y-0.5">
                    {categorizedModels.deepseek.map((m) => (
                      <ModelOptionItem
                        key={m.id}
                        model={m}
                        isSelected={m.id === modelName}
                        onSelect={() => handleSelect(m.id)}
                        formatCtx={formatCtx}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Models */}
              {categorizedModels.others.length > 0 && (
                <div>
                  <div className="sticky top-0 z-1 bg-popover/95 px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-xs">
                    Other Models ({categorizedModels.others.length})
                  </div>
                  <div className="space-y-0.5">
                    {categorizedModels.others.map((m) => (
                      <ModelOptionItem
                        key={m.id}
                        model={m}
                        isSelected={m.id === modelName}
                        onSelect={() => handleSelect(m.id)}
                        formatCtx={formatCtx}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>{models.length} models available</span>
          <span className="flex items-center gap-1">
            <Cpu className="size-3" />
            <span>OpenAI-compatible v1</span>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ModelOptionItemProps {
  model: AiModel
  isSelected: boolean
  onSelect: () => void
  formatCtx: (ctx?: number) => string | null
}

function ModelOptionItem({
  model,
  isSelected,
  onSelect,
  formatCtx,
}: ModelOptionItemProps) {
  const caps = model.capabilities
  const ctx = formatCtx(model.context_length || caps?.contextWindow)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full cursor-pointer flex-col gap-1 rounded-md px-2.5 py-1.5 text-left transition-colors",
        isSelected
          ? "bg-accent font-medium text-accent-foreground"
          : "text-foreground hover:bg-muted/80"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium">{model.id}</span>
        {isSelected && <Check className="size-3.5 shrink-0 text-primary" />}
      </div>

      {/* Capabilities & Metadata Pills */}
      <div className="flex flex-wrap items-center gap-1 text-[10px]">
        {ctx && (
          <span className="py-0.2 rounded bg-muted/60 px-1 font-mono text-[9px] text-muted-foreground">
            {ctx}
          </span>
        )}
        {caps?.reasoning && (
          <Badge
            variant="outline"
            className="h-4 gap-0.5 border-purple-500/30 px-1 py-0 text-[9px] font-normal text-purple-600 dark:text-purple-400"
          >
            <Brain className="size-2.5" />
            <span>Reasoning</span>
          </Badge>
        )}
        {caps?.vision && (
          <Badge
            variant="outline"
            className="h-4 gap-0.5 border-blue-500/30 px-1 py-0 text-[9px] font-normal text-blue-600 dark:text-blue-400"
          >
            <Eye className="size-2.5" />
            <span>Vision</span>
          </Badge>
        )}
        {caps?.pdf && (
          <Badge
            variant="outline"
            className="h-4 gap-0.5 border-amber-500/30 px-1 py-0 text-[9px] font-normal text-amber-600 dark:text-amber-400"
          >
            <FileText className="size-2.5" />
            <span>PDF</span>
          </Badge>
        )}
        {caps?.search && (
          <Badge
            variant="outline"
            className="h-4 gap-0.5 border-emerald-500/30 px-1 py-0 text-[9px] font-normal text-emerald-600 dark:text-emerald-400"
          >
            <Globe className="size-2.5" />
            <span>Search</span>
          </Badge>
        )}
        {caps?.tools && (
          <Badge
            variant="outline"
            className="h-4 gap-0.5 border-border px-1 py-0 text-[9px] font-normal text-slate-600 dark:text-slate-400"
          >
            <Wrench className="size-2.5" />
            <span>Tools</span>
          </Badge>
        )}
      </div>
    </button>
  )
}

export default AssistantModelSelect
