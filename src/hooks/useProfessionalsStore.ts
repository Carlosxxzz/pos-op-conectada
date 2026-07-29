import { create } from 'zustand';
import type { Profissionais } from '@/entities';

interface ProfessionalsStore {
  professionals: Profissionais[];
  setProfessionals: (professionals: Profissionais[]) => void;
  addProfessional: (professional: Profissionais) => void;
  updateProfessional: (professional: Profissionais) => void;
  removeProfessional: (id: string) => void;
  clearProfessionals: () => void;
}

export const useProfessionalsStore = create<ProfessionalsStore>((set) => ({
  professionals: [],
  setProfessionals: (professionals) => set({ professionals }),
  addProfessional: (professional) =>
    set((state) => ({
      professionals: [professional, ...state.professionals],
    })),
  updateProfessional: (professional) =>
    set((state) => ({
      professionals: state.professionals.map((p) =>
        p._id === professional._id ? professional : p
      ),
    })),
  removeProfessional: (id) =>
    set((state) => ({
      professionals: state.professionals.filter((p) => p._id !== id),
    })),
  clearProfessionals: () => set({ professionals: [] }),
}));
