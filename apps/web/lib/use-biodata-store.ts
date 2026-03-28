import { create } from "zustand"
import {
  initialProfileDraft,
  syncVerificationState,
  type ProfileDraft,
} from "@acme/core"

interface BiodataState {
  draft: ProfileDraft
  setDraft: (updater: ProfileDraft | ((prev: ProfileDraft) => ProfileDraft)) => void
  reset: () => void
}

export const useBiodataStore = create<BiodataState>((set) => ({
  draft: initialProfileDraft,
  setDraft: (updater) =>
    set((state) => {
      const nextDraft = typeof updater === "function" ? updater(state.draft) : updater
      return { draft: syncVerificationState(nextDraft) }
    }),
  reset: () => set({ draft: initialProfileDraft }),
}))
