import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Fallback sample data jika API gagal
const FALLBACK_ADS = [
  {
    id: 'fallback-1',
    title: 'Sample Image',
    type: 'image',
    image_url: 'https://picsum.photos/800/600?random=1',
    youtube_id: null,
    duration: 5000
  },
  {
    id: 'fallback-2',
    title: 'Sample Video',
    type: 'video',
    image_url: null,
    youtube_id: 'dQw4w9WgXcQ',
    duration: 30000
  }
];

function ScreenSaver() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adsData, setAdsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCounts, setViewCounts] = useState({});
  const timerRef = useRef(null);
  
  // API Functions
  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8181';
      const response = await fetch(`${BASE_URL}/ads/active`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const transformedAds = data.data.map(ad => {
            let duration = ad.duration;
            if (duration && duration < 1000) {
              duration = duration * 1000;
            }
            
            return {
              id: ad.id,
              title: ad.title,
              type: ad.type.toLowerCase(),
              image_url: ad.type.toLowerCase() === 'image' ? ad.image_url : null,
              youtube_id: ad.type.toLowerCase() === 'video' ? ad.youtube_id : null,
              duration: duration || (ad.type.toLowerCase() === 'video' ? 30000 : 5000),
              order: ad.order || 0
            };
          });
          
          const sortedAds = transformedAds.sort((a, b) => a.order - b.order);
          
          if (sortedAds.length > 0) {
            setAdsData(sortedAds);
            setCurrentIndex(0);
          } else {
            setAdsData(FALLBACK_ADS);
          }
        } else {
          setAdsData(FALLBACK_ADS);
        }
      } else {
        setAdsData(FALLBACK_ADS);
      }
    } catch (error) {
      setAdsData(FALLBACK_ADS);
    } finally {
      setIsLoading(false);
    }
  };

  const trackAdView = async (adId) => {
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8181';
      const response = await fetch(`${BASE_URL}/ads/view-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_id: adId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setViewCounts(prev => ({ ...prev, [adId]: 0 }));
        } else {
          setViewCounts(prev => ({ ...prev, [adId]: (prev[adId] || 0) + 1 }));
        }
      } else {
        setViewCounts(prev => ({ ...prev, [adId]: (prev[adId] || 0) + 1 }));
      }
    } catch (error) {
      setViewCounts(prev => ({ ...prev, [adId]: (prev[adId] || 0) + 1 }));
    }
  };

  // Navigation Functions
  const nextAd = () => {
    if (currentAd) {
      trackAdView(currentAd.id);
    }
    setCurrentIndex((prev) => (prev + 1) % adsData.length);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleInteraction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimer();
    
    if (currentAd) {
      trackAdView(currentAd.id);
    }
    
    navigate('/');
  };

  // Get current ad
  const currentAd = adsData[currentIndex];

  // Effects
  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (!currentAd || adsData.length === 0 || isLoading) return;

    clearTimer();
    timerRef.current = setTimeout(() => {
      nextAd();
    }, currentAd.duration);

    return () => clearTimer();
  }, [currentIndex, adsData, isLoading]);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === 'IFRAME') return;
      handleInteraction(e);
    };
    
    const handleKeyPress = () => handleInteraction({ preventDefault: () => {}, stopPropagation: () => {} });
    const handleMouseMove = () => handleInteraction({ preventDefault: () => {}, stopPropagation: () => {} });
    
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading ads...</div>
      </div>
    );
  }

  // No ads state
  if (!currentAd) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-2xl">No ads available</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-blue-500 transition-all ease-linear"
          style={{
            animation: `progress ${currentAd.duration}ms linear forwards`
          }}
        />
      </div>
      
      {/* Ad counter dots */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex space-x-2">
          {adsData.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Ad counter text */}
      <div className="absolute top-4 left-4 z-50 text-white text-lg bg-black bg-opacity-50 p-3 rounded">
        <div>Ads {currentIndex + 1}/{adsData.length}</div>
      </div>
      
      {/* Ad content */}
      <div className="w-full h-full flex items-center justify-center">
        {currentAd.type === 'image' ? (
          <img
            src={currentAd.image_url}
            alt={currentAd.title}
            className="max-w-full max-h-full object-contain"
            onError={() => nextAd()}
          />
        ) : currentAd.type === 'video' && currentAd.youtube_id ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentAd.youtube_id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${currentAd.youtube_id}&disablekb=1&fs=0&iv_load_policy=3`}
            className="w-full h-full"
            style={{ pointerEvents: 'none' }}
            frameBorder="0"
            allow="autoplay; encrypted-media; compute-pressure"
            onError={() => nextAd()}
          />
        ) : (
          <div className="text-white text-2xl">
            Invalid ad format
          </div>
        )}
      </div>
      
      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default ScreenSaver;
