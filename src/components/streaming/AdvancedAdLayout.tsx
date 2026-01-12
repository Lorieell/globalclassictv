import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';
import type { SlideAd, StaticAd, Ad, SlideImage } from '@/types/ads';

interface AdvancedAdLayoutProps {
  children: ReactNode;
  showAds?: boolean;
  heroSlideIndex?: number; // Sync with hero slider
}

// Validate that AdSense code only contains legitimate Google AdSense scripts
const isValidAdSenseCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  // Only allow Google AdSense domains
  const allowedDomains = [
    'pagead2.googlesyndication.com',
    'adsbygoogle.js',
    'googleadservices.com',
    'googlesyndication.com'
  ];
  
  // Check for script src attributes - only allow Google domains
  const scriptSrcPattern = /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptSrcPattern.exec(code)) !== null) {
    const src = match[1];
    if (!allowedDomains.some(domain => src.includes(domain))) {
      console.warn('AdSense validation failed: unauthorized script domain:', src);
      return false;
    }
  }
  
  // Check for inline scripts with actual code (not just closing tags)
  // This pattern matches scripts that have content between opening and closing tags
  const inlineScriptPattern = /<script[^>]*>([^<]+)<\/script>/gi;
  while ((match = inlineScriptPattern.exec(code)) !== null) {
    const scriptContent = match[1].trim();
    // Only allow the standard adsbygoogle.push call or empty content
    if (scriptContent && !scriptContent.match(/^\s*\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\s*\(\s*\{\s*\}\s*\)\s*;?\s*$/)) {
      console.warn('AdSense validation failed: unauthorized inline script content');
      return false;
    }
  }
  
  // Check for event handlers (onclick, onerror, onload, etc.)
  const eventHandlerPattern = /\bon\w+\s*=/i;
  if (eventHandlerPattern.test(code)) {
    console.warn('AdSense validation failed: event handlers not allowed');
    return false;
  }
  
  // Check for javascript: URLs
  if (/javascript:/i.test(code)) {
    console.warn('AdSense validation failed: javascript: URLs not allowed');
    return false;
  }
  
  // Check for data: URLs (can be used for XSS)
  if (/data:/i.test(code)) {
    console.warn('AdSense validation failed: data: URLs not allowed');
    return false;
  }
  
  return true;
};

// Component to render PropellerAds
const PropellerAdSlot = ({ zoneId, format }: { zoneId: string; format: 'banner' | 'native' | 'push' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !zoneId) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // PropellerAds script injection based on format
    const script = document.createElement('script');
    script.async = true;
    
    if (format === 'banner') {
      // Banner ads script
      script.src = `//pl18795430.highcpmgate.com/${zoneId}/invoke.js`;
      script.setAttribute('data-cfasync', 'false');
      
      const container = document.createElement('div');
      container.id = `container-${zoneId}`;
      containerRef.current.appendChild(container);
      containerRef.current.appendChild(script);
    } else if (format === 'native') {
      // Native ads
      script.src = `//pl18795430.highcpmgate.com/${zoneId}/invoke.js`;
      script.setAttribute('data-cfasync', 'false');
      containerRef.current.appendChild(script);
    } else if (format === 'push') {
      // Push notification setup (initial prompt only)
      script.src = `//pl18795430.highcpmgate.com/${zoneId}/invoke.js`;
      script.setAttribute('data-cfasync', 'false');
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [zoneId, format]);

  return (
    <div ref={containerRef} className="propellerads-container min-h-[50px]" />
  );
};

// Component to render AdSense code safely
const AdSenseSlot = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    
    // SECURITY: Validate AdSense code before rendering
    if (!isValidAdSenseCode(code)) {
      console.error('Invalid AdSense code detected - refusing to render');
      return;
    }
    
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
  if (ad.adType === 'propellerads' && ad.propellerZoneId) {
    return <PropellerAdSlot zoneId={ad.propellerZoneId} format={ad.propellerFormat || 'banner'} />;
  }

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
      if (ad.type === 'static') {
        if (ad.adType === 'adsense') return !!ad.adsenseCode;
        if (ad.adType === 'propellerads') return !!ad.propellerZoneId;
        return !!ad.imageUrl;
      }
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
    if (ad.type === 'static') {
      if (ad.adType === 'adsense') return !!ad.adsenseCode;
      if (ad.adType === 'propellerads') return !!ad.propellerZoneId;
      return !!ad.imageUrl;
    }
    return false;
  });

  const hasRightAds = settings.right.ads.some(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') return ad.images.length > 0;
    if (ad.type === 'static') {
      if (ad.adType === 'adsense') return !!ad.adsenseCode;
      if (ad.adType === 'propellerads') return !!ad.propellerZoneId;
      return !!ad.imageUrl;
    }
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
