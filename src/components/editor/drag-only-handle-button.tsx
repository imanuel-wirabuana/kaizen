import { useCallback } from "react"
import { SideMenuExtension } from "@blocknote/core/extensions"
import {
  useComponentsContext,
  useDictionary,
  useExtension,
  useExtensionState,
} from "@blocknote/react"
import { GripVertical } from "lucide-react"

export function DragOnlyHandleButton() {
  const Components = useComponentsContext()
  const dict = useDictionary()

  const sideMenu = useExtension(SideMenuExtension)
  const block = useExtensionState(SideMenuExtension, {
    selector: (state) => state?.block,
  })

  // Prevent any click trigger or action - handle is strictly for dragging
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  if (!Components || !block) {
    return null
  }

  return (
    <Components.SideMenu.Button
      label={dict?.side_menu?.drag_handle_label ?? "Drag to move"}
      draggable={true}
      onDragStart={(e) => sideMenu?.blockDragStart(e, block)}
      onDragEnd={() => sideMenu?.blockDragEnd()}
      onClick={handleClick}
      className="bn-button cursor-grab hover:bg-muted active:cursor-grabbing"
      icon={
        <GripVertical
          className="size-6 text-muted-foreground"
          data-test="dragHandle"
        />
      }
    />
  )
}

export default DragOnlyHandleButton
