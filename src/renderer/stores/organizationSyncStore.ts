import { create } from "zustand";
import { GitHubAPI } from "../services/github";
import { useAuthStore } from "./authStore";

interface OrgSyncSettings {
  login: string;
  avatar_url: string;
  isSyncing: boolean;
}

interface OrganizationSyncState {
  organizations: OrgSyncSettings[];
  loading: boolean;
  fetchUserOrganizations: () => Promise<void>;
  toggleOrgSync: (orgLogin: string, isSyncing: boolean) => void;
  getEnabledOrgs: () => string[];
}

export const useOrganizationSyncStore = create<OrganizationSyncState>((set, get) => {
  // Load from localStorage
  const loadFromStorage = (): OrgSyncSettings[] => {
    try {
      const stored = localStorage.getItem("organizationSyncSettings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load org sync settings from storage:", error);
    }
    return [];
  };

  // Save to localStorage
  const saveToStorage = (orgs: OrgSyncSettings[]) => {
    try {
      localStorage.setItem("organizationSyncSettings", JSON.stringify(orgs));
    } catch (error) {
      console.error("Failed to save org sync settings to storage:", error);
    }
  };

  const initialOrgs = loadFromStorage();

  return {
    organizations: initialOrgs,
    loading: false,

    fetchUserOrganizations: async () => {
      set({ loading: true });
      try {
        const { token } = useAuthStore.getState();
        const api = new GitHubAPI(token);
        const orgs = await api.getUserOrganizations();

        // Get previously saved sync settings
        const savedOrgs = get().organizations;
        const savedSyncMap = new Map(
          savedOrgs.map((o) => [o.login, o.isSyncing])
        );

        // Create new org list, preserving sync settings for existing orgs
        // Default to syncing=true for new orgs
        const updatedOrgs = orgs.map((org) => ({
          login: org.login,
          avatar_url: org.avatar_url,
          isSyncing: savedSyncMap.get(org.login) ?? true,
        }));

        set({ organizations: updatedOrgs });
        saveToStorage(updatedOrgs);
      } catch (error) {
        console.error("Failed to fetch user organizations:", error);
      } finally {
        set({ loading: false });
      }
    },

    toggleOrgSync: (orgLogin: string, isSyncing: boolean) => {
      set((state) => {
        const updatedOrgs = state.organizations.map((org) =>
          org.login === orgLogin ? { ...org, isSyncing } : org
        );
        saveToStorage(updatedOrgs);
        return { organizations: updatedOrgs };
      });
    },

    getEnabledOrgs: () => {
      const state = get();
      return state.organizations
        .filter((org) => org.isSyncing)
        .map((org) => org.login);
    },
  };
});
