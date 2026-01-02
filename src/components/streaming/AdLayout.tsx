import { useState, useEffect, ReactNode, useRef } from 'react';

interface AdSettings {
  leftEnabled: boolean;
  leftType: 'image' | 'adsense';
  leftImageUrl: string;
  leftLinkUrl: string;
  leftAdsenseCode: string;
  rightEnabled: boolean;
  rightType: 'image' | 'adsense';
  rightImageUrl: string;
  rightLinkUrl: string;
  rightAdsenseCode: string;
}

const ADS_STORAGE_KEY = 'gctv-ads-settings';

interface AdLayoutProps {
  children: ReactNode;
  showAds?: boolean;
}

// Component to render AdSense code safely
const AdSenseSlot = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create a container for the ad
    const adContainer = document.createElement('div');
    adContainer.innerHTML = code;
    
    // Find and execute scripts
    const scripts = adContainer.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
    
    containerRef.current.appendChild(adContainer);
    
    // Try to push AdSense
    try {
      if ((window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (e) {
      console.log('AdSense push error:', e);
    }
  }, [code]);

  return <div ref={containerRef} className="adsense-container" />;
};

const AdLayout = ({ children, showAds = true }: AdLayoutProps) => {
  const [ads, setAds] = useState<AdSettings | null>(null);

  useEffect(() => {
    const loadAds = () => {
      const stored = localStorage.getItem(ADS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAds(parsed);
        } catch (e) {
          console.error('Failed to parse ads settings:', e);
        }
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

  const showLeft = showAds && ads?.leftEnabled && (
    (ads.leftType === 'image' && ads.leftImageUrl && ads.leftImageUrl.trim() !== '') ||
    (ads.leftType === 'adsense' && ads.leftAdsenseCode && ads.leftAdsenseCode.trim() !== '')
  );
  
  const showRight = showAds && ads?.rightEnabled && (
    (ads.rightType === 'image' && ads.rightImageUrl && ads.rightImageUrl.trim() !== '') ||
    (ads.rightType === 'adsense' && ads.rightAdsenseCode && ads.rightAdsenseCode.trim() !== '')
  );
  
  const hasAnyAd = showLeft || showRight;

  if (!showAds || !hasAnyAd) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      {/* Left ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
        {showLeft && (
          <div className="sticky top-24">
            {ads?.leftType === 'adsense' && ads.leftAdsenseCode ? (
              <AdSenseSlot code={ads.leftAdsenseCode} />
            ) : (
              <a 
                href={ads?.leftLinkUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img 
                  src={ads?.leftImageUrl} 
                  alt="Publicité" 
                  className="w-full max-h-[600px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
        {showRight && (
          <div className="sticky top-24">
            {ads?.rightType === 'adsense' && ads.rightAdsenseCode ? (
              <AdSenseSlot code={ads.rightAdsenseCode} />
            ) : (
              <a 
                href={ads?.rightLinkUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img 
                  src={ads?.rightImageUrl} 
                  alt="Publicité" 
                  className="w-full max-h-[600px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdLayout;
