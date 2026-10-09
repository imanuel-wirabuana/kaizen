import { useState } from "react"
import { useRoute, useLocation } from "wouter"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import {
  SettingsSidebar,
  type SettingsSection,
} from "@/features/settings/components/settings-sidebar"
import { GeneralSettingsPanel } from "@/features/settings/components/general-settings-panel"
import { AppearanceSettingsPanel } from "@/features/settings/components/appearance-settings-panel"
import { DangerZoneSettingsPanel } from "@/features/settings/components/danger-zone-settings-panel"
import { ImportSettingsDialog } from "@/features/settings/components/import-settings-dialog"
import { exportWorkspaceSettings } from "@/features/settings/services/settings-import-export"
import { toast } from "@/components/ui/toast"
import type { Workspace } from "@/types/workspace"

export function SettingsPage() {
  const [, setLocation] = useLocation()
  const [matchSection, sectionParams] = useRoute("/settings/:section")

  const {
    activeWorkspace,
    updateWorkspace,
    archiveWorkspace,
    deleteWorkspace,
    transferOwnership,
  } = useWorkspaces()

  const { canRead, canUpdate, isLoading: isPermsLoading } = useWorkspacePermissions()
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Determine active section from URL or default to "general"
  const rawSection = matchSection && sectionParams?.section ? sectionParams.section : "general"
  const activeSection: SettingsSection =
    rawSection === "appearance" || rawSection === "danger" ? rawSection : "general"

  const handleSelectSection = (section: SettingsSection) => {
    setLocation(`/settings/${section}`)
  }

  // 1. workspace.read guard
  if (!isPermsLoading && !canRead("workspace")) {
    return (
      <AccessDeniedState
        resource="Settings"
        description="You do not have permission to view workspace settings."
      />
    )
  }

  // Handle Export Settings (JSON)
  const handleExport = () => {
    if (!activeWorkspace) {
      toast.error("Export unavailable", {
        description: "No active workspace is currently selected.",
      })
      return
    }
    exportWorkspaceSettings(activeWorkspace)
  }

  // Handle Import Settings (JSON)
  const handleApplyImport = async (imported: {
    name?: string
    description?: string | null
    settings: Record<string, unknown>
  }) => {
    if (!activeWorkspace) return

    const mergedSettings = {
      ...(activeWorkspace.settings || {}),
      ...(imported.settings || {}),
    }

    const updates: Partial<Workspace> = {
      settings: mergedSettings,
    }

    if (imported.name) {
      updates.name = imported.name.trim()
    }
    if (imported.description !== undefined) {
      updates.description = imported.description?.trim() || null
    }

    await updateWorkspace(activeWorkspace.id, updates)
    toast.success("Settings applied", {
      description: "Workspace configuration has been updated from JSON.",
    })
  }

  // Danger Zone actions
  const handleArchive = async (id: number) => {
    const success = await archiveWorkspace(id)
    if (success) {
      setLocation("/")
    }
    return success
  }

  const handleTransfer = async (workspaceId: number, newOwnerId: string) => {
    return transferOwnership(workspaceId, newOwnerId)
  }

  const handleDelete = async (id: number) => {
    const success = await deleteWorkspace(id)
    if (success) {
      setLocation("/")
    }
    return success
  }

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <SettingsSidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onImportClick={() => setIsImportOpen(true)}
          onExportClick={handleExport}
          workspaceName={activeWorkspace?.name}
        />
      }
    >
      {activeSection === "general" && (
        <GeneralSettingsPanel
          workspace={activeWorkspace}
          canUpdate={canUpdate("workspace")}
          onUpdateWorkspace={updateWorkspace}
        />
      )}

      {activeSection === "appearance" && <AppearanceSettingsPanel />}

      {activeSection === "danger" && (
        <DangerZoneSettingsPanel
          workspace={activeWorkspace}
          onArchiveWorkspace={handleArchive}
          onTransferOwnership={handleTransfer}
          onDeleteWorkspace={handleDelete}
        />
      )}

      <ImportSettingsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onApplySettings={handleApplyImport}
      />
    </PageSidebarLayout>
  )
}

export default SettingsPage
