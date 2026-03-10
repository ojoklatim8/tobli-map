import { create } from 'zustand';

export const useStore = create((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  selectedBusiness: null,
  setSelectedBusiness: (business) => set({ selectedBusiness: business }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // search results from supabase.rpc
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  currentIndex: 0,
  setCurrentIndex: (i) => set({ currentIndex: i }),
}));
