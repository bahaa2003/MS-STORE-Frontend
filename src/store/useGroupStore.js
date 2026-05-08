import { create } from 'zustand';
import { mockGroups } from '../data/mockData';
import apiClient from '../services/client';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';
let hasFetchedGroupsFromBackendThisSession = false;

let groupsRequest = null;
const useGroupStore = create((set, get) => ({
  groups: isRealProvider ? [] : mockGroups,
  groupsLastLoadedAt: 0,
  loadGroups: async ({ force = true } = {}) => {
    const { groups } = get();
    const hasGroups = Array.isArray(groups) && groups.length > 0;

    if (!force && hasGroups) return groups;

    if (groupsRequest) return groupsRequest;

    groupsRequest = apiClient.groups.list()
      .then((items) => {
        const nextGroups = Array.isArray(items) ? items : (isRealProvider ? [] : mockGroups);
        set({ groups: nextGroups, groupsLastLoadedAt: Date.now() });
        if (isRealProvider) hasFetchedGroupsFromBackendThisSession = true;
        return nextGroups;
      })
      .catch(() => {
        if (!hasGroups) set({ groups: isRealProvider ? [] : mockGroups });
        return get().groups;
      })
      .finally(() => { groupsRequest = null; });

    return groupsRequest;
  },
  addGroup: async (group) => {
    const created = await apiClient.groups.create(group);
    set((state) => ({
      groups: [...state.groups, created || { ...group, id: Date.now() }],
      groupsLastLoadedAt: Date.now(),
    }));
    return created;
  },
  updateGroup: async (id, updatedGroup) => {
    const updated = await apiClient.groups.update(id, updatedGroup);
    set((state) => ({
      groups: state.groups.map((g) => (String(g.id) === String(id) ? { ...g, ...updatedGroup, ...(updated || {}) } : g)),
      groupsLastLoadedAt: Date.now(),
    }));
    return updated;
  },
  deleteGroup: async (id) => {
    await apiClient.groups.delete(id);
    set((state) => ({
      groups: state.groups.filter((g) => String(g.id) !== String(id)),
      groupsLastLoadedAt: Date.now(),
    }));
    return { success: true };
  },
}));

export default useGroupStore;
