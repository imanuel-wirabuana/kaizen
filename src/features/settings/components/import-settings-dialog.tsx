import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  validateSettingsImportJson,
  type ValidatedImportResult,
} from "@/features/settings/services/settings-import-export"

export interface ImportSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySettings: (imported: {
    name?: string
    description?: string | null
    settings: Record<string, unknown>
  }) => Promise<void>
}

export function ImportSettingsDialog({
  open,
  onOpenChange,
  onApplySettings,
}: ImportSettingsDialogProps) {
  const [fileName, setFileName] = useState<string>("")
  const [validationResult, setValidationResult] = useState<ValidatedImportResult | null>(null)
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true)
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleReset = () => {
    setFileName("")
    setValidationResult(null)
    setIncludeMetadata(true)
    setIsApplying(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string) || ""
      const res = validateSettingsImportJson(text)
      setValidationResult(res)
    }
    reader.onerror = () => {
      toast.error("File reading failed", {
        description: "Could not read the selected JSON file.",
      })
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string) || ""
      const res = validateSettingsImportJson(text)
      setValidationResult(res)
    }
    reader.readAsText(file)
  }

  const handleApply = async () => {
    if (!validationResult?.isValid || !validationResult.data) return

    try {
      setIsApplying(true)
      const { name, description, settings } = validationResult.data

      await onApplySettings({
        name: includeMetadata ? name : undefined,
        description: includeMetadata ? description : undefined,
        settings,
      })

      onOpenChange(false)
      handleReset()
    } catch (err) {
      toast.error("Import failed", {
        description: (err as Error).message || "Could not apply settings.",
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleReset()
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="size-4 text-primary" />
            Import Settings (JSON)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a Kaizen settings JSON file to update workspace configuration and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </div>
            {fileName ? (
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-foreground">{fileName}</span>
                <span className="text-[11px] text-muted-foreground">
                  Click or drag another file to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-foreground">
                  Choose JSON file or drag here
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Only .json files are supported
                </span>
              </div>
            )}
          </div>

          {/* Validation Feedback & Preview */}
          {validationResult && (
            <div className="flex flex-col gap-2">
              {validationResult.isValid ? (
                <div className="flex flex-col gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Valid settings file detected</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex flex-col gap-1 pl-5">
                    {validationResult.data?.name && (
                      <div>
                        <strong>Workspace Name:</strong> {validationResult.data.name}
                      </div>
                    )}
                    {validationResult.data?.settings && (
                      <div>
                        <strong>Settings properties:</strong>{" "}
                        {Object.keys(validationResult.data.settings).join(", ") || "Empty"}
                      </div>
                    )}
                  </div>

                  {validationResult.data?.name && (
                    <label className="flex items-center gap-2 pt-1 pl-5 cursor-pointer text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Also update workspace name and description</span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{validationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
            className="cursor-pointer text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!validationResult?.isValid || isApplying}
            className="cursor-pointer text-xs gap-1.5"
          >
            {isApplying && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isApplying ? "Applying..." : "Apply Settings"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
