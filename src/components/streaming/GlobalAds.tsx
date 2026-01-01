import { useState, useEffect } from 'react';

interface AdSettings {
  leftEnabled: boolean;
  leftImageUrl: string;
  leftLinkUrl: string;
  rightEnabled: boolean;
  rightImageUrl: string;
  rightLinkUrl: string;
}

const ADS_STORAGE_KEY = 'gctv-ads-settings';

const GlobalAds = () => {
  const [ads, setAds] = useState<AdSettings | null>(null);

  useEffect(() => {
    const loadAds = () => {
      const stored = localStorage.getItem(ADS_STORAGE_KEY);
      if (stored) {
        setAds(JSON.parse(stored));
      }
    };

    loadAds();

    // Listen for ads updates
    window.addEventListener('gctv-ads-updated', loadAds);
    return () => window.removeEventListener('gctv-ads-updated', loadAds);
  }, []);

  if (!ads) return null;

  const showLeft = ads.leftEnabled && ads.leftImageUrl;
  const showRight = ads.rightEnabled && ads.rightImageUrl;

  if (!showLeft && !showRight) return null;

  return (
    <>
      {/* Left Ad */}
      {showLeft && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
          <a 
            href={ads.leftLinkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              src={ads.leftImageUrl} 
              alt="Publicité" 
              className="max-w-[120px] max-h-[600px] object-contain rounded-r-lg shadow-lg"
            />
          </a>
        </div>
      )}

      {/* Right Ad */}
      {showRight && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
          <a 
            href={ads.rightLinkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              src={ads.rightImageUrl} 
              alt="Publicité" 
              className="max-w-[120px] max-h-[600px] object-contain rounded-l-lg shadow-lg"
            />
          </a>
        </div>
      )}
    </>
  );
};

export default GlobalAds;
