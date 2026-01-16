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

// Fallback ad images - streaming/entertainment themed
const FALLBACK_ADS = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=160&h=600&fit=crop&q=80',
    linkUrl: '#',
    alt: 'Cinema'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&h=600&fit=crop&q=80',
    linkUrl: '#',
    alt: 'Movie Theater'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=160&h=600&fit=crop&q=80',
    linkUrl: '#',
    alt: 'Film Reel'
  }
];

// PropellerAds Component - Shows fallback immediately since PropellerAds often blocked
const PropellerAdSlot = ({ 
  zoneId, 
  format,
  adId 
}: { 
  zoneId: string; 
  format: 'banner' | 'native' | 'push' | 'popunder' | 'interstitial';
  adId: string;
}) => {
  // Get a stable fallback ad based on adId
  const fallbackIndex = adId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % FALLBACK_ADS.length;
  const fallbackAd = FALLBACK_ADS[fallbackIndex];

  useEffect(() => {
    // Track impression
    trackImpression(adId, zoneId, `propeller-${format}`);

    // For popunder and interstitial, still try to inject
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
    }
  }, [zoneId, format, adId]);

  // Popunder/interstitial don't show visually
  if (format === 'popunder' || format === 'interstitial') {
    return null;
  }

  // Always show fallback image - PropellerAds scripts are typically blocked
  return (
    <div className="fallback-ad flex items-center justify-center rounded-lg overflow-hidden" style={{ width: '160px' }}>
      <a
        href={fallbackAd.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group"
        onClick={() => trackClick(adId, zoneId, 'fallback')}
      >
        <img
          src={fallbackAd.imageUrl}
          alt={fallbackAd.alt}
          className="w-full h-auto object-cover rounded-lg shadow-lg transition-transform group-hover:scale-105"
          style={{ width: '160px', minHeight: '200px', maxHeight: '400px' }}
        />
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
          Publicité
        </div>
      </a>
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