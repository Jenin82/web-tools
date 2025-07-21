import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JiraStore {
  email: string;
  apiToken: string;
  domain: string;
  setEmail: (email: string) => void;
  setApiToken: (apiToken: string) => void;
  setDomain: (domain: string) => void;
  isConnected: () => boolean;
  clear: () => void;
}

export const useJiraStore = create<JiraStore>()(
  persist(
    (set, get) => ({
      email: '',
      apiToken: '',
      domain: '',
      setEmail: (email: string) => set({ email }),
      setApiToken: (apiToken: string) => set({ apiToken }),
      setDomain: (domain: string) => set({ domain: domain.replace(/\/$/, '') }), // Remove trailing slash
      isConnected: () => {
        const { email, apiToken, domain } = get();
        return !!email && !!apiToken && !!domain;
      },
      clear: () => set({ email: '', apiToken: '', domain: '' }),
    }),
    {
      name: 'jira-storage', // name of the item in the storage (must be unique)
    }
  )
);
