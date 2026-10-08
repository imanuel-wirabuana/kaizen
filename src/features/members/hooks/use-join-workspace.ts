import { useCallback } from "react"
import { useUser } from "@clerk/clerk-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { workspaceKeys } from "@/features/workspaces/services/workspace-keys"
import {
  verifyInviteCode,
  acceptWorkspaceInviteRecord,
  type VerifiedInviteResult,
} from "@/features/members/services/invite-service"
import { memberKeys } from "@/features/members/services/member-keys"

export function useJoinWorkspace() {
  const { user } = useUser()
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId
  )

  const verifyMutation = useMutation({
    mutationFn: async (code: string): Promise<VerifiedInviteResult> => {
      return verifyInviteCode(code, user?.id)
    },
  })

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) {
        throw new Error("You must be signed in to join a workspace.")
      }
      return acceptWorkspaceInviteRecord(code, user.id)
    },
    onSuccess: (result) => {
      if (!user) return

      // Invalidate workspace list so the newly joined workspace appears
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.list(user.id),
      })
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all,
      })

      // Switch directly to the joined workspace
      setActiveWorkspaceId(result.workspaceId)

      toast.success("Joined workspace successfully", {
        description: "You now have access to collaborate on this workspace.",
      })
    },
    onError: (err) => {
      toast.error("Failed to join workspace", {
        description: (err as Error).message || "Could not accept invite.",
      })
    },
  })

  const mutateVerifyAsync = verifyMutation.mutateAsync
  const verifyCode = useCallback(
    (code: string) => mutateVerifyAsync(code),
    [mutateVerifyAsync]
  )

  const mutateJoinAsync = joinMutation.mutateAsync
  const joinWorkspace = useCallback(
    (code: string) => mutateJoinAsync(code),
    [mutateJoinAsync]
  )

  return {
    verifyCode,
    joinWorkspace,
    isVerifying: verifyMutation.isPending,
    isJoining: joinMutation.isPending,
    verifyError: verifyMutation.error
      ? (verifyMutation.error as Error).message
      : null,
    joinError: joinMutation.error ? (joinMutation.error as Error).message : null,
    resetVerify: verifyMutation.reset,
  }
}
