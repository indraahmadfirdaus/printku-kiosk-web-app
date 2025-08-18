const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8181';

// Fetch active ads
export const fetchActiveAds = async () => {
  const response = await fetch(`${BASE_URL}/api/ads/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch ads');
  }

  // Transform API data to match our store format
  // Dalam fetchActiveAds function
  const transformedAds = data.ads.map(ad => {
    // PERBAIKAN: Pastikan duration dalam milliseconds
    let duration = ad.duration;
    
    // Jika backend mengirim dalam detik, konversi ke ms
    if (duration && duration < 1000) {
      duration = duration * 1000;
      console.log('🔄 Converting duration from seconds to ms:', ad.duration, '->', duration);
    }
    
    return {
      id: ad.id,
      title: ad.title,
      type: ad.type.toLowerCase(),
      url: ad.type.toLowerCase() === 'image' ? ad.url : null,
      youtubeId: ad.type.toLowerCase() === 'video' ? extractYouTubeId(ad.url) : null,
      duration: duration || (ad.type.toLowerCase() === 'video' ? 30000 : 5000), // Fallback
      order: ad.order
    };
  });

  // Sort by order
  return transformedAds.sort((a, b) => a.order - b.order);
};

// Track ad view count - Updated to support count parameter
export const trackAdView = async (adsId, count = 1) => {
  // Validasi apakah ads ID masih aktif
  const activeAds = await fetchActiveAds();
  const isValidAd = activeAds.some(ad => ad.id === adsId);
  
  if (!isValidAd) {
    console.warn(`Ad ID ${adsId} is no longer active, skipping view count`);
    return { success: false, message: 'Ad no longer active' };
  }
  
  const requestBody = {
    ads_id: adsId,
  };
  
  // Only add count if it's not 1 (default)
  if (count > 1) {
    requestBody.count = count;
  }
  
  const response = await fetch(`${BASE_URL}/api/ads/view-count`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to track view');
  }

  return data;
};

// Batch track multiple ad views - New function for efficiency
export const batchTrackAdViews = async (viewCounts) => {
  const promises = viewCounts.map(({ adId, count }) => 
    trackAdView(adId, count)
  );
  
  try {
    const results = await Promise.allSettled(promises);
    
    // Log any failures but don't throw
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to track view for ad ${viewCounts[index].adId}:`, result.reason);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Batch track ad views failed:', error);
    throw error;
  }
};