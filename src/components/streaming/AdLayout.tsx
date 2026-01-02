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
        try {
          const parsed = JSON.parse(stored);
          setAds(parsed);
          console.log('Ads loaded:', parsed);
        } catch (e) {
          console.error('Failed to parse ads settings:', e);
        }
      } else {
        console.log('No ads settings found in localStorage');
      }
    };

    loadAds();
    window.addEventListener('gctv-ads-updated', loadAds);
    window.addEventListener('storage', loadAds);
    return () => {
      window.removeEventListener('gctv-ads-updated', loadAds);
      window.removeEventListener('storage', loadAds);
    };
  }, []);

  const showLeft = showAds && ads?.leftEnabled && ads.leftImageUrl && ads.leftImageUrl.trim() !== '';
  const showRight = showAds && ads?.rightEnabled && ads.rightImageUrl && ads.rightImageUrl.trim() !== '';
  const hasAnyAd = showLeft || showRight;

  // Debug log
  useEffect(() => {
    console.log('AdLayout state:', { showAds, showLeft, showRight, hasAnyAd, ads });
  }, [showAds, showLeft, showRight, hasAnyAd, ads]);

  if (!showAds || !hasAnyAd) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      {/* Left ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
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
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
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
