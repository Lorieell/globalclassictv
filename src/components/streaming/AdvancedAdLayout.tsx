import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';
import type { SlideAd, StaticAd, Ad, SlideImage } from '@/types/ads';

interface AdvancedAdLayoutProps {
  children: ReactNode;
  showAds?: boolean;
  heroSlideIndex?: number; // Sync with hero slider
}

// Component to render AdSense code safely
const AdSenseSlot = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    
    containerRef.current.innerHTML = '';
    
    const adContainer = document.createElement('div');
    adContainer.innerHTML = code;
    
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

// Slide Ad Component with auto-rotation
const SlideAdBanner = ({ 
  ad,
  syncIndex 
}: { 
  ad: SlideAd;
  syncIndex?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If synced with hero, use hero's index
    if (syncIndex !== undefined) {
      setCurrentIndex(syncIndex % ad.images.length);
      return;
    }

    // Otherwise, auto-rotate
    if (ad.images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ad.images.length);
    }, ad.interval * 1000);

    return () => clearInterval(timer);
  }, [ad.images.length, ad.interval, syncIndex]);

  if (ad.images.length === 0) return null;

  const currentImage = ad.images[currentIndex];
  if (!currentImage) return null;

  return (
    <div className="relative w-full">
      <a
        href={currentImage.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity duration-500"
      >
        <img
          src={currentImage.imageUrl}
          alt="Publicité"
          className="w-full max-h-[300px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
        />
      </a>
      {/* Indicators */}
      {ad.images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {ad.images.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex 
                  ? 'w-4 bg-primary' 
                  : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Static Ad Component
const StaticAdBanner = ({ ad }: { ad: StaticAd }) => {
  if (ad.adType === 'adsense' && ad.adsenseCode) {
    return <AdSenseSlot code={ad.adsenseCode} />;
  }

  if (ad.adType === 'image' && ad.imageUrl) {
    return (
      <a
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={ad.imageUrl}
          alt="Publicité"
          className="w-full max-h-[300px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
        />
      </a>
    );
  }

  return null;
};

// Side column component
const AdColumn = ({ 
  ads, 
  heroSyncEnabled,
  heroSlideIndex,
}: { 
  ads: Ad[];
  heroSyncEnabled: boolean;
  heroSlideIndex?: number;
}) => {
  // Sort by order and filter enabled ads
  const sortedAds = [...ads]
    .filter(ad => ad.enabled)
    .filter(ad => {
      if (ad.type === 'slide') return ad.images.length > 0;
      if (ad.type === 'static') return ad.adType === 'adsense' ? !!ad.adsenseCode : !!ad.imageUrl;
      return false;
    })
    .sort((a, b) => a.order - b.order);

  if (sortedAds.length === 0) return null;

  return (
    <div className="sticky top-24 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
      {sortedAds.map((ad) => (
        ad.type === 'slide' ? (
          <SlideAdBanner
            key={ad.id}
            ad={ad}
            syncIndex={heroSyncEnabled ? heroSlideIndex : undefined}
          />
        ) : (
          <StaticAdBanner
            key={ad.id}
            ad={ad}
          />
        )
      ))}
    </div>
  );
};

const AdvancedAdLayout = ({ 
  children, 
  showAds = true, 
  heroSlideIndex 
}: AdvancedAdLayoutProps) => {
  const { settings, loading } = useAdSettings();

  if (loading || !showAds) {
    return <>{children}</>;
  }

  // Check if there are any active ads
  const hasLeftAds = settings.left.ads.some(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') return ad.images.length > 0;
    if (ad.type === 'static') return ad.adType === 'adsense' ? !!ad.adsenseCode : !!ad.imageUrl;
    return false;
  });

  const hasRightAds = settings.right.ads.some(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') return ad.images.length > 0;
    if (ad.type === 'static') return ad.adType === 'adsense' ? !!ad.adsenseCode : !!ad.imageUrl;
    return false;
  });

  if (!hasLeftAds && !hasRightAds) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      {/* Left ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
        {hasLeftAds && (
          <AdColumn
            ads={settings.left.ads}
            heroSyncEnabled={settings.heroSyncEnabled}
            heroSlideIndex={heroSlideIndex}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
        {hasRightAds && (
          <AdColumn
            ads={settings.right.ads}
            heroSyncEnabled={settings.heroSyncEnabled}
            heroSlideIndex={heroSlideIndex}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedAdLayout;
