import { create } from 'zustand';
import type { ChecklistsDirios } from '@/entities';

interface ChecklistFlowState {
  // Temporary checklist data (not yet saved)
  tempChecklistData: Partial<ChecklistsDirios> | null;
  
  // Saved checklist ID (only after photo is uploaded)
  savedChecklistId: string | null;
  
  // Actions
  setTempChecklistData: (data: Partial<ChecklistsDirios>) => void;
  setSavedChecklistId: (id: string) => void;
  clearChecklistFlow: () => void;
}

export const useChecklistFlow = create<ChecklistFlowState>((set) => ({
  tempChecklistData: null,
  savedChecklistId: null,
  
  setTempChecklistData: (data) => set({ tempChecklistData: data }),
  setSavedChecklistId: (id) => set({ savedChecklistId: id }),
  clearChecklistFlow: () => set({ tempChecklistData: null, savedChecklistId: null }),
}));
