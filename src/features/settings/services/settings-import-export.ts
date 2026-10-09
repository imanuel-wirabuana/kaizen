import { toast } from "@/components/ui/toast"
import type { Workspace } from "@/types/workspace"

export interface ExportedSettingsPayload {
  version: number
  exported_at: string
  workspace: {
    id?: number
    name: string
    description?: string | null
    settings: Record<string, unknown>
  }
}

export interface ValidatedImportResult {
  isValid: boolean
  error?: string
  data?: {
    name?: string
    description?: string | null
    settings: Record<string, unknown>
  }
}

function sanitizeSettingsWithoutOwner(
  settings: Record<string, unknown>,
  ownerId?: string
): Record<string, unknown> {
  const clean = { ...settings }
  delete clean.owner_profile
  delete clean.owner_info
  if (ownerId && clean.profiles && typeof clean.profiles === "object") {
    const profiles = { ...(clean.profiles as Record<string, unknown>) }
    delete profiles[ownerId]
    clean.profiles = profiles
  }
  return clean
}

/**
 * Downloads the current workspace settings as a formatted JSON file.
 */
export function exportWorkspaceSettings(workspace: Workspace): void {
  try {
    const cleanSettings = sanitizeSettingsWithoutOwner(
      (workspace.settings as Record<string, unknown>) || {},
      workspace.owner_id
    )

    const payload: ExportedSettingsPayload = {
      version: 1,
      exported_at: new Date().toISOString(),
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description || null,
        settings: cleanSettings,
      },
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const slug = workspace.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "workspace"
    const filename = `kaizen-${slug}-settings.json`

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Settings exported", {
      description: `Saved configuration to ${filename}`,
    })
  } catch (err) {
    toast.error("Export failed", {
      description: (err as Error).message || "Could not generate settings export file.",
    })
  }
}

/**
 * Parses and validates an uploaded settings JSON file string.
 * Supports both full exported payload ({ workspace: { settings } }) and raw settings object ({ settings: ... }).
 */
export function validateSettingsImportJson(rawText: string): ValidatedImportResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: "The provided file is empty.",
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (err) {
    return {
      isValid: false,
      error: `Invalid JSON format: ${(err as Error).message}`,
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      isValid: false,
      error: "JSON content must be a valid key-value object.",
    }
  }

  const obj = parsed as Record<string, unknown>

  // Pattern 1: Nested { workspace: { name, description, settings } }
  if (obj.workspace && typeof obj.workspace === "object" && !Array.isArray(obj.workspace)) {
    const ws = obj.workspace as Record<string, unknown>
    const settings =
      ws.settings && typeof ws.settings === "object" && !Array.isArray(ws.settings)
        ? (ws.settings as Record<string, unknown>)
        : {}

    return {
      isValid: true,
      data: {
        name: typeof ws.name === "string" ? ws.name : undefined,
        description: typeof ws.description === "string" ? ws.description : null,
        settings: sanitizeSettingsWithoutOwner(settings),
      },
    }
  }

  // Pattern 2: Direct settings object { settings: { ... }, name?: ... }
  if (obj.settings && typeof obj.settings === "object" && !Array.isArray(obj.settings)) {
    return {
      isValid: true,
      data: {
        name: typeof obj.name === "string" ? obj.name : undefined,
        description: typeof obj.description === "string" ? obj.description : null,
        settings: sanitizeSettingsWithoutOwner(obj.settings as Record<string, unknown>),
      },
    }
  }

  // Pattern 3: Direct key-value settings dictionary (e.g. { timezone: "...", default_view: "..." })
  return {
    isValid: true,
    data: {
      settings: sanitizeSettingsWithoutOwner(obj),
    },
  }
}
