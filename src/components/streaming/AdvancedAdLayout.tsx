import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';
import { supabase } from '@/integrations/supabase/client';
import type { SlideAd, StaticAd, Ad, SlideImage } from '@/types/ads';

interface AdvancedAdLayoutProps {
  children: ReactNode;
  showAds?: boolean;
  heroSlideIndex?: number;
}

// Track impression
const trackImpression = async (adId: string, zoneId: string | null, adType: string) => {
  try {
    await supabase.from('ad_stats').insert({
      ad_id: adId,
      zone_id: zoneId,
      ad_type: adType,
      event_type: 'impression'
    });
  } catch (e) {
    // Silently fail - don't break the ad display
  }
};

// Track click
const trackClick = async (adId: string, zoneId: string | null, adType: string) => {
  try {
    await supabase.from('ad_stats').insert({
      ad_id: adId,
      zone_id: zoneId,
      ad_type: adType,
      event_type: 'click'
    });
  } catch (e) {
    // Silently fail
  }
};

// Validate that AdSense code only contains legitimate Google AdSense scripts
const isValidAdSenseCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  const allowedDomains = [
    'pagead2.googlesyndication.com',
    'adsbygoogle.js',
    'googleadservices.com',
    'googlesyndication.com'
  ];
  
  const scriptSrcPattern = /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptSrcPattern.exec(code)) !== null) {
    const src = match[1];
    if (!allowedDomains.some(domain => src.includes(domain))) {
      console.warn('AdSense validation failed: unauthorized script domain:', src);
      return false;
    }
  }
  
  const inlineScriptPattern = /<script[^>]*>([^<]+)<\/script>/gi;
  while ((match = inlineScriptPattern.exec(code)) !== null) {
    const scriptContent = match[1].trim();
    if (scriptContent && !scriptContent.match(/^\s*\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\s*\(\s*\{\s*\}\s*\)\s*;?\s*$/)) {
      console.warn('AdSense validation failed: unauthorized inline script content');
      return false;
    }
  }
  
  const eventHandlerPattern = /\bon\w+\s*=/i;
  if (eventHandlerPattern.test(code)) {
    console.warn('AdSense validation failed: event handlers not allowed');
    return false;
  }
  
  if (/javascript:/i.test(code)) {
    console.warn('AdSense validation failed: javascript: URLs not allowed');
    return false;
  }
  
  if (/data:/i.test(code)) {
    console.warn('AdSense validation failed: data: URLs not allowed');
    return false;
  }
  
  return true;
};

// PropellerAds Component - Fixed implementation with safe cleanup
const PropellerAdSlot = ({ 
  zoneId, 
  format,
  adId 
}: { 
  zoneId: string; 
  format: 'banner' | 'native' | 'push' | 'popunder' | 'interstitial';
  adId: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!zoneId) return;

    // Track impression
    trackImpression(adId, zoneId, `propeller-${format}`);

    // For popunder and interstitial, inject globally
    if (format === 'popunder' || format === 'interstitial') {
      const existingScript = document.querySelector(`script[data-zone="${zoneId}"]`);
      if (existingScript) return;

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.setAttribute('data-zone', zoneId);
      
      script.innerHTML = `
        (function(d,z,s){s.src='https://'+d+'/400/'+z;try{(document.body||document.documentElement).appendChild(s)}catch(e){}})('vemtoutcheeg.com','${zoneId}',document.createElement('script'));
      `;
      document.body.appendChild(script);
      return;
    }

    if (!containerRef.current) return;

    // Create a separate container for ad content that we manage manually
    const adWrapper = document.createElement('div');
    adWrapper.id = `ad-wrapper-${zoneId}-${Date.now()}`;
    adWrapper.style.cssText = 'width:160px;min-height:300px;margin:0 auto;display:flex;align-items:center;justify-content:center;';
    
    // Store reference for cleanup
    iframeContainerRef.current = adWrapper;
    
    // Use an iframe approach to isolate ad scripts from React DOM
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:160px;height:600px;border:none;overflow:hidden;';
    iframe.scrolling = 'no';
    iframe.setAttribute('frameborder', '0');
    
    iframe.onload = () => {
      if (!mountedRef.current) return;
      
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          setHasError(true);
          return;
        }
        
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              atOptions = {
                'key' : '${zoneId}',
                'format' : 'iframe',
                'height' : 600,
                'width' : 160,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.topcreativeformat.com/${zoneId}/invoke.js" async></script>
          </body>
          </html>
        `);
        iframeDoc.close();
        
        if (mountedRef.current) {
          setIsLoaded(true);
        }
      } catch (e) {
        console.log('PropellerAds iframe error:', e);
        if (mountedRef.current) {
          setHasError(true);
        }
      }
    };
    
    iframe.onerror = () => {
      if (mountedRef.current) {
        setHasError(true);
      }
    };
    
    adWrapper.appendChild(iframe);
    containerRef.current.appendChild(adWrapper);

    // Cleanup function that safely removes elements
    return () => {
      mountedRef.current = false;
      // Don't try to remove children - just clear the reference
      // React will handle the container removal
      if (iframeContainerRef.current) {
        try {
          // Remove iframe src to stop any pending loads
          const iframes = iframeContainerRef.current.querySelectorAll('iframe');
          iframes.forEach(f => {
            f.src = 'about:blank';
          });
        } catch (e) {
          // Ignore cleanup errors
        }
        iframeContainerRef.current = null;
      }
    };
  }, [zoneId, format, adId]);

  // Popunder/interstitial don't show visually
  if (format === 'popunder' || format === 'interstitial') {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="propellerads-container flex items-center justify-center rounded-lg overflow-hidden"
      style={{ 
        width: '160px', 
        minHeight: '300px',
        maxHeight: '600px',
        backgroundColor: hasError ? 'transparent' : 'rgba(0,0,0,0.1)'
      }}
    >
      {!isLoaded && !hasError && (
        <div className="flex flex-col items-center gap-2 p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Pub</span>
        </div>
      )}
    </div>
  );
};

// AdSense Component
const AdSenseSlot = ({ code, adId }: { code: string; adId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    
    if (!isValidAdSenseCode(code)) {
      console.error('Invalid AdSense code detected - refusing to render');
      return;
    }

    // Track impression
    trackImpression(adId, null, 'adsense');
    
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
  }, [code, adId]);

  return <div ref={containerRef} className="adsense-container" style={{ minHeight: '250px' }} />;
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
  const slideType = ad.slideType || 'images';

  useEffect(() => {
    if (slideType === 'propellerads') return;
    
    if (syncIndex !== undefined && ad.images.length > 0) {
      setCurrentIndex(syncIndex % ad.images.length);
      return;
    }

    if (ad.images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ad.images.length);
    }, ad.interval * 1000);

    return () => clearInterval(timer);
  }, [ad.images.length, ad.interval, syncIndex, slideType]);

  // PropellerAds type
  if (slideType === 'propellerads' && ad.propellerZoneId) {
    return <PropellerAdSlot zoneId={ad.propellerZoneId} format={ad.propellerFormat || 'banner'} adId={ad.id} />;
  }

  if (ad.images.length === 0) return null;

  const currentImage = ad.images[currentIndex];
  if (!currentImage) return null;

  const handleClick = () => {
    trackClick(ad.id, null, 'slide-image');
  };

  return (
    <div className="relative w-full max-w-[160px]">
      <a
        href={currentImage.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity duration-500"
        onClick={handleClick}
      >
        <img
          src={currentImage.imageUrl}
          alt="Publicité"
          className="w-full max-h-[400px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
        />
      </a>
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
  const handleClick = () => {
    trackClick(ad.id, ad.propellerZoneId || null, ad.adType);
  };

  if (ad.adType === 'propellerads' && ad.propellerZoneId) {
    return <PropellerAdSlot zoneId={ad.propellerZoneId} format={ad.propellerFormat || 'banner'} adId={ad.id} />;
  }

  if (ad.adType === 'adsense' && ad.adsenseCode) {
    return <AdSenseSlot code={ad.adsenseCode} adId={ad.id} />;
  }

  if (ad.adType === 'image' && ad.imageUrl) {
    return (
      <a
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[160px]"
        onClick={handleClick}
      >
        <img
          src={ad.imageUrl}
          alt="Publicité"
          className="w-full max-h-[400px] object-contain rounded-lg hover:opacity-90 transition-opacity shadow-lg"
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
  const sortedAds = [...ads]
    .filter(ad => ad.enabled)
    .filter(ad => {
      if (ad.type === 'slide') {
        const slideType = ad.slideType || 'images';
        if (slideType === 'propellerads') return !!ad.propellerZoneId;
        return ad.images.length > 0;
      }
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
    <div className="flex flex-col items-center justify-center gap-4 w-full">
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

  // Check for active ads
  const hasLeftAds = settings.left.ads.some(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') {
      const slideType = ad.slideType || 'images';
      if (slideType === 'propellerads') return !!ad.propellerZoneId;
      return ad.images.length > 0;
    }
    if (ad.type === 'static') {
      if (ad.adType === 'adsense') return !!ad.adsenseCode;
      if (ad.adType === 'propellerads') return !!ad.propellerZoneId;
      return !!ad.imageUrl;
    }
    return false;
  });

  const hasRightAds = settings.right.ads.some(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') {
      const slideType = ad.slideType || 'images';
      if (slideType === 'propellerads') return !!ad.propellerZoneId;
      return ad.images.length > 0;
    }
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
      {/* Left ad column - centered vertically */}
      {hasLeftAds && (
        <div className="hidden xl:flex w-[180px] flex-shrink-0 items-center justify-center sticky top-20 self-start h-[calc(100vh-80px)] py-4">
          <AdColumn
            ads={settings.left.ads}
            heroSyncEnabled={settings.heroSyncEnabled}
            heroSlideIndex={heroSlideIndex}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right ad column - centered vertically */}
      {hasRightAds && (
        <div className="hidden xl:flex w-[180px] flex-shrink-0 items-center justify-center sticky top-20 self-start h-[calc(100vh-80px)] py-4">
          <AdColumn
            ads={settings.right.ads}
            heroSyncEnabled={settings.heroSyncEnabled}
            heroSlideIndex={heroSlideIndex}
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedAdLayout;