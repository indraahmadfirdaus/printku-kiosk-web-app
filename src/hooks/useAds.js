import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchActiveAds, trackAdView, batchTrackAdViews } from '../services/adsApi';
import useAdsStore from '../stores/adsStore';

// Hook untuk fetch active ads
export const useActiveAds = () => {
  const { setAds } = useAdsStore();
  
  const query = useQuery({
    queryKey: ['activeAds'],
    queryFn: fetchActiveAds,
    refetchOnWindowFocus: false, // PERBAIKAN: Matikan auto refetch saat focus
    staleTime: 5 * 60 * 1000, // PERBAIKAN: Tingkatkan ke 5 menit
    refetchInterval: false, // PERBAIKAN: Matikan auto refetch interval
    retry: 2, // PERBAIKAN: Kurangi retry
    refetchOnMount: 'always', // Hanya fetch saat mount
  });

  // Update Zustand store ketika data berhasil di-fetch
  useEffect(() => {
    if (query.data && query.isSuccess) {
      console.log('🔄 Updating ads data to store:', query.data.length, 'ads');
      setAds(query.data);
    }
  }, [query.data, query.isSuccess, setAds]);

  return query;
};

// Hook untuk track single view count
export const useTrackAdView = () => {
  const { clearViewCount } = useAdsStore();
  
  return useMutation({
    mutationFn: ({ adId, count = 1 }) => trackAdView(adId, count),
    onSuccess: (_, { adId }) => {
      // Clear local view count setelah berhasil dikirim
      clearViewCount(adId);
    },
    onError: (error) => {
      console.error('Failed to track ad view:', error);
      // View count tetap tersimpan di local untuk retry nanti
    },
  });
};

// Hook untuk batch track view counts - Fixed version
export const useBatchTrackAdViews = () => {
  const { clearMultipleViewCounts } = useAdsStore();
  
  return useMutation({
    mutationFn: batchTrackAdViews,
    onSuccess: (results, viewCounts) => {
      // Collect successful ad IDs for batch clearing
      const successfulAdIds = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulAdIds.push(viewCounts[index].adId);
        }
      });
      
      // Clear all successful view counts in one operation
      if (successfulAdIds.length > 0) {
        clearMultipleViewCounts(successfulAdIds);
        console.log('Cleared view counts for ads:', successfulAdIds);
      }
      
      console.log('Batch view tracking completed:', {
        total: results.length,
        successful: successfulAdIds.length,
        failed: results.length - successfulAdIds.length
      });
    },
    onError: (error) => {
      console.error('Failed to batch track ad views:', error);
      // View counts tetap tersimpan di local untuk retry nanti
    },
  });
};

// Tambahkan cleanup function
export const useCleanupInactiveAdViews = () => {
  const { getPendingViewCounts, clearMultipleViewCounts } = useAdsStore();
  
  return useMutation({
    mutationFn: async () => {
      const activeAds = await fetchActiveAds();
      const activeAdIds = activeAds.map(ad => ad.id);
      const pendingViews = getPendingViewCounts();
      
      // Find inactive ad IDs
      const inactiveAdIds = pendingViews
        .filter(view => !activeAdIds.includes(view.adId))
        .map(view => view.adId);
      
      if (inactiveAdIds.length > 0) {
        console.log('Cleaning up view counts for inactive ads:', inactiveAdIds);
        clearMultipleViewCounts(inactiveAdIds);
      }
      
      return inactiveAdIds;
    }
  });
};