import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClockifyWorkspace } from '../types';

interface ClockifyStore {
  apiKey: string;
  workspaceId: string;
  workspaces: ClockifyWorkspace[];
  setApiKey: (apiKey: string) => void;
  setWorkspaceId: (workspaceId: string) => void;
  setWorkspaces: (workspaces: ClockifyWorkspace[]) => void;
  clear: () => void;
}

export const useClockifyStore = create<ClockifyStore>()(
  persist(
    (set) => ({
      apiKey: '',
      workspaceId: '',
      workspaces: [],
      setApiKey: (apiKey: string) => set({ apiKey }),
      setWorkspaceId: (workspaceId: string) => set({ workspaceId }),
      setWorkspaces: (workspaces: ClockifyWorkspace[]) => set({ workspaces }),
      clear: () => set({ apiKey: '', workspaceId: '', workspaces: [] }),
    }),
    {
      name: 'clockify-storage', // name of the item in the storage (must be unique)
    }
  )
);
