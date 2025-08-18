import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tambahkan di adsStore.js
const useAdsStore = create(
  persist(
    (set, get) => ({
      // Ads data dari API
      ads: [],
      
      // Index ads yang sedang aktif
      currentAdIndex: 0,
      
      // View count tracking (stored locally)
      viewCounts: {}, // { adId: count }
      
      // Fungsi untuk pindah ke ads berikutnya
      nextAd: () => {
        const { ads, currentAdIndex } = get();
        if (ads.length === 0) return;
        
        const nextIndex = (currentAdIndex + 1) % ads.length;
        set({ currentAdIndex: nextIndex });
      },
      
      // Fungsi untuk mendapatkan ads yang sedang aktif
      getCurrentAd: () => {
        const { ads, currentAdIndex } = get();
        return ads[currentAdIndex] || null;
      },
      
      // Fungsi untuk reset ke ads pertama
      resetAds: () => {
        set({ currentAdIndex: 0 });
      },
      
      // Fungsi untuk set ads dari API
      setAds: (newAds) => {
        console.log('Setting new ads to store:', newAds);
        set({ 
          ads: newAds,
          currentAdIndex: 0 // Reset to first ad when new ads loaded
        });
      },
      
      // Fungsi untuk track view count locally
      incrementViewCount: (adId) => {
        const { viewCounts } = get();
        const newCount = (viewCounts[adId] || 0) + 1;
        
        console.log(`Incrementing view count for ad ${adId}: ${viewCounts[adId] || 0} -> ${newCount}`);
        
        set({ 
          viewCounts: {
            ...viewCounts,
            [adId]: newCount
          }
        });
      },

      // Fungsi untuk clear multiple view counts - Enhanced with logging
      clearMultipleViewCounts: (adIds) => {
        const { viewCounts } = get();
        const newViewCounts = { ...viewCounts };
        
        console.log('Clearing view counts for ads:', adIds);
        console.log('Before clearing:', viewCounts);
        
        adIds.forEach(adId => {
          delete newViewCounts[adId];
        });
        
        console.log('After clearing:', newViewCounts);
        set({ viewCounts: newViewCounts });
      },
      
      // Fungsi untuk get view count
      getViewCount: (adId) => {
        const { viewCounts } = get();
        return viewCounts[adId] || 0;
      },
      
      // Fungsi untuk get all pending view counts
      getPendingViewCounts: () => {
        const { viewCounts } = get();
        return Object.entries(viewCounts)
          .filter(([_, count]) => count > 0)
          .map(([adId, count]) => ({ adId, count }));
      },
      
      // Fungsi untuk clear view count setelah berhasil dikirim ke API
      clearViewCount: (adId) => {
        const { viewCounts } = get();
        const newViewCounts = { ...viewCounts };
        delete newViewCounts[adId];
        set({ viewCounts: newViewCounts });
      },
      
      // Fungsi untuk clear semua view counts - New function
      clearAllViewCounts: () => {
        set({ viewCounts: {} });
      },
      
      // Fungsi untuk clear multiple view counts - New function
      clearMultipleViewCounts: (adIds) => {
        const { viewCounts } = get();
        const newViewCounts = { ...viewCounts };
        adIds.forEach(adId => {
          delete newViewCounts[adId];
        });
        set({ viewCounts: newViewCounts });
      },
      
      // Fungsi untuk force refresh ads (akan digunakan oleh React Query)
      forceRefreshAds: () => {
        console.log('🔄 Force refreshing ads data...');
        // This will be called by React Query refetch
      },
    }),
    {
      name: 'blackboxz-ads-storage',
      partialize: (state) => ({ 
        currentAdIndex: state.currentAdIndex,
        viewCounts: state.viewCounts // Persist view counts
      }),
    }
  )
);

export default useAdsStore;