import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';
import type { SideAdSettings, SlideImage } from '@/types/ads';

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
  images, 
  interval, 
  syncIndex 
}: { 
  images: SlideImage[]; 
  interval: number;
  syncIndex?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If synced with hero, use hero's index
    if (syncIndex !== undefined) {
      setCurrentIndex(syncIndex % images.length);
      return;
    }

    // Otherwise, auto-rotate
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [images.length, interval, syncIndex]);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];
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
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
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
const StaticAdBanner = ({ 
  type, 
  imageUrl, 
  linkUrl, 
  adsenseCode 
}: { 
  type: 'image' | 'adsense';
  imageUrl: string;
  linkUrl: string;
  adsenseCode: string;
}) => {
  if (type === 'adsense' && adsenseCode) {
    return <AdSenseSlot code={adsenseCode} />;
  }

  if (type === 'image' && imageUrl) {
    return (
      <a
        href={linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={imageUrl}
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
  side, 
  sideSettings, 
  heroSyncEnabled,
  heroSlideIndex,
}: { 
  side: 'left' | 'right';
  sideSettings: SideAdSettings;
  heroSyncEnabled: boolean;
  heroSlideIndex?: number;
}) => {
  const { slideAd, staticAd } = sideSettings;
  
  const hasSlideAd = slideAd.enabled && slideAd.images.length > 0;
  const hasStaticAd = staticAd.enabled && (
    (staticAd.type === 'image' && staticAd.imageUrl) ||
    (staticAd.type === 'adsense' && staticAd.adsenseCode)
  );

  if (!hasSlideAd && !hasStaticAd) return null;

  return (
    <div className="sticky top-24 space-y-4">
      {hasSlideAd && (
        <SlideAdBanner
          images={slideAd.images}
          interval={slideAd.interval}
          syncIndex={heroSyncEnabled ? heroSlideIndex : undefined}
        />
      )}
      {hasStaticAd && (
        <StaticAdBanner
          type={staticAd.type}
          imageUrl={staticAd.imageUrl}
          linkUrl={staticAd.linkUrl}
          adsenseCode={staticAd.adsenseCode}
        />
      )}
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

  const hasLeftAds = (
    (settings.left.slideAd.enabled && settings.left.slideAd.images.length > 0) ||
    (settings.left.staticAd.enabled && (settings.left.staticAd.imageUrl || settings.left.staticAd.adsenseCode))
  );

  const hasRightAds = (
    (settings.right.slideAd.enabled && settings.right.slideAd.images.length > 0) ||
    (settings.right.staticAd.enabled && (settings.right.staticAd.imageUrl || settings.right.staticAd.adsenseCode))
  );

  if (!hasLeftAds && !hasRightAds) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      {/* Left ad space */}
      <div className="hidden lg:flex w-[160px] flex-shrink-0 p-3 justify-center">
        {hasLeftAds && (
          <AdColumn
            side="left"
            sideSettings={settings.left}
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
            side="right"
            sideSettings={settings.right}
            heroSyncEnabled={settings.heroSyncEnabled}
            heroSlideIndex={heroSlideIndex}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedAdLayout;
