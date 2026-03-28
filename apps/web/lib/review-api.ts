import "server-only"

import { mergeProfileDraft, syncVerificationState, type ProfileDraft, type VerificationState } from "@acme/core"

export type ReviewQueueItem = {
  userId: string
  displayName: string
  verificationStatus: string
  updatedAt?: string | null
  draft: ProfileDraft
}

type FirestoreProfileDoc = {
  displayName?: string
  verificationStatus?: string
  updatedAt?: { toDate?: () => Date } | null
  draft?: Partial<ProfileDraft>
}

export function reviewQueueItemFromDoc(userId: string, data: FirestoreProfileDoc): ReviewQueueItem {
  const draft = syncVerificationState(mergeProfileDraft(data.draft))

  return {
    userId,
    displayName: data.displayName ?? `${draft.basics.firstName} ${draft.basics.lastName}`.trim(),
    verificationStatus:
      data.verificationStatus ?? `${draft.verification.nicStatus}:${draft.verification.selfieStatus}`,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
    draft,
  }
}

export function applyVerificationDecision(
  draft: ProfileDraft,
  decision: { nicStatus?: VerificationState; selfieStatus?: VerificationState },
) {
  return syncVerificationState(
    mergeProfileDraft({
      ...draft,
      verification: {
        ...draft.verification,
        ...(decision.nicStatus ? { nicStatus: decision.nicStatus } : {}),
        ...(decision.selfieStatus ? { selfieStatus: decision.selfieStatus } : {}),
      },
    }),
  )
}
