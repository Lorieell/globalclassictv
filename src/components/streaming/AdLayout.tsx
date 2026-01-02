import { useState, useEffect, ReactNode } from 'react';

interface AdSettings {
  leftEnabled: boolean;
  leftImageUrl: string;
  leftLinkUrl: string;
  rightEnabled: boolean;
  rightImageUrl: string;
  rightLinkUrl: string;
}

const ADS_STORAGE_KEY = 'gctv-ads-settings';

interface AdLayoutProps {
  children: ReactNode;
  showAds?: boolean;
}

const AdLayout = ({ children, showAds = true }: AdLayoutProps) => {
  const [ads, setAds] = useState<AdSettings | null>(null);

  useEffect(() => {
    const loadAds = () => {
      const stored = localStorage.getItem(ADS_STORAGE_KEY);
      if (stored) {
        setAds(JSON.parse(stored));
      }
    };

    loadAds();
    window.addEventListener('gctv-ads-updated', loadAds);
    return () => window.removeEventListener('gctv-ads-updated', loadAds);
  }, []);

  const showLeft = showAds && ads?.leftEnabled && ads.leftImageUrl;
  const showRight = showAds && ads?.rightEnabled && ads.rightImageUrl;
  const hasAnyAd = showLeft || showRight;

  if (!showAds || !hasAnyAd) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      {/* Left ad space - always reserve space when any ad is enabled */}
      <div className="hidden xl:block w-[140px] flex-shrink-0 p-2">
        {showLeft && (
          <a 
            href={ads?.leftLinkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block sticky top-24"
          >
            <img 
              src={ads?.leftImageUrl} 
              alt="Publicité" 
              className="w-full max-h-[600px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            />
          </a>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right ad space */}
      <div className="hidden xl:block w-[140px] flex-shrink-0 p-2">
        {showRight && (
          <a 
            href={ads?.rightLinkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block sticky top-24"
          >
            <img 
              src={ads?.rightImageUrl} 
              alt="Publicité" 
              className="w-full max-h-[600px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            />
          </a>
        )}
      </div>
    </div>
  );
};

export default AdLayout;
