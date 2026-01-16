import { useState, useEffect, useCallback, useRef } from 'react';

type AdNetwork = 'propellerads' | 'adsense' | 'fallback';

interface AdNetworkStatus {
  propellerads: boolean | null; // null = not tested, true = works, false = blocked
  adsense: boolean | null;
}

interface UseAdNetworkDetectionResult {
  status: AdNetworkStatus;
  preferredNetwork: AdNetwork;
  isTestingComplete: boolean;
  retestNetworks: () => void;
}

const STORAGE_KEY = 'gctv-ad-network-status';
const TEST_VALIDITY_MS = 24 * 60 * 60 * 1000; // Re-test every 24 hours

// Test if PropellerAds is accessible
const testPropellerAds = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 3000);
    
    // Create a hidden test element
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
    testDiv.id = 'propeller-test-' + Math.random().toString(36).substring(7);
    document.body.appendChild(testDiv);
    
    // Try to load a PropellerAds script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://vemtoutcheeg.com/pfe/current/tag.min.js?z=test';
    
    script.onload = () => {
      clearTimeout(timeout);
      testDiv.remove();
      script.remove();
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      testDiv.remove();
      script.remove();
      resolve(false);
    };
    
    testDiv.appendChild(script);
    
    // Also check for adblocker by looking for blocked elements
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(testDiv);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        clearTimeout(timeout);
        testDiv.remove();
        script.remove();
        resolve(false);
      }
    }, 500);
  });
};

// Test if AdSense is accessible
const testAdSense = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 3000);
    
    // Create a hidden test element
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
    testDiv.id = 'adsense-test-' + Math.random().toString(36).substring(7);
    document.body.appendChild(testDiv);
    
    // Try to load AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      clearTimeout(timeout);
      testDiv.remove();
      script.remove();
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      testDiv.remove();
      script.remove();
      resolve(false);
    };
    
    testDiv.appendChild(script);
    
    // Check if script was blocked
    setTimeout(() => {
      if (!script.parentNode) {
        clearTimeout(timeout);
        testDiv.remove();
        resolve(false);
      }
    }, 500);
  });
};

// Check for common adblocker signatures
const detectAdblocker = (): boolean => {
  // Check if common adblocker elements exist
  const baitElement = document.createElement('div');
  baitElement.className = 'adsbox ad-banner textads banner-ads';
  baitElement.style.cssText = 'position:absolute;left:-9999px;';
  baitElement.innerHTML = '&nbsp;';
  document.body.appendChild(baitElement);
  
  // Wait a tick and check if it was hidden
  const isBlocked = baitElement.offsetHeight === 0 || 
                    baitElement.offsetWidth === 0 ||
                    window.getComputedStyle(baitElement).display === 'none';
  
  baitElement.remove();
  return isBlocked;
};

export const useAdNetworkDetection = (): UseAdNetworkDetectionResult => {
  const [status, setStatus] = useState<AdNetworkStatus>({
    propellerads: null,
    adsense: null,
  });
  const [isTestingComplete, setIsTestingComplete] = useState(false);
  const testingRef = useRef(false);

  const runTests = useCallback(async () => {
    if (testingRef.current) return;
    testingRef.current = true;
    
    // First check localStorage for cached results
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const { status: cachedStatus, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < TEST_VALIDITY_MS) {
          setStatus(cachedStatus);
          setIsTestingComplete(true);
          testingRef.current = false;
          return;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Quick adblocker check first
    const hasAdblocker = detectAdblocker();
    
    if (hasAdblocker) {
      // Adblocker detected - assume both are blocked
      const newStatus: AdNetworkStatus = {
        propellerads: false,
        adsense: false,
      };
      setStatus(newStatus);
      setIsTestingComplete(true);
      
      // Cache the result
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        status: newStatus,
        timestamp: Date.now(),
      }));
      testingRef.current = false;
      return;
    }

    // Run network-specific tests in parallel
    const [propellerResult, adsenseResult] = await Promise.all([
      testPropellerAds(),
      testAdSense(),
    ]);

    const newStatus: AdNetworkStatus = {
      propellerads: propellerResult,
      adsense: adsenseResult,
    };
    
    setStatus(newStatus);
    setIsTestingComplete(true);
    
    // Cache the result
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: newStatus,
      timestamp: Date.now(),
    }));
    
    testingRef.current = false;
  }, []);

  const retestNetworks = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus({ propellerads: null, adsense: null });
    setIsTestingComplete(false);
    testingRef.current = false;
    runTests();
  }, [runTests]);

  // Run tests on mount
  useEffect(() => {
    runTests();
  }, [runTests]);

  // Determine preferred network
  const preferredNetwork: AdNetwork = (() => {
    if (status.propellerads === true) return 'propellerads';
    if (status.adsense === true) return 'adsense';
    return 'fallback';
  })();

  return {
    status,
    preferredNetwork,
    isTestingComplete,
    retestNetworks,
  };
};
