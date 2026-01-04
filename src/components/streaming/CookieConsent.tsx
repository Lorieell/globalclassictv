import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, Settings } from 'lucide-react';

const CONSENT_KEY = 'gctv-cookie-consent';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    timestamp: 0
  });

  useEffect(() => {
    // Check if user has already consented
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    if (!storedConsent) {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent(parsed);
        // Enable Google services if marketing accepted
        if (parsed.marketing) {
          enableGoogleServices();
        }
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const enableGoogleServices = () => {
    // Signal to Google AdSense that consent was given
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    }
  };

  const saveConsent = (newConsent: ConsentState) => {
    const consentWithTimestamp = { ...newConsent, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    setConsent(consentWithTimestamp);
    
    if (newConsent.marketing) {
      enableGoogleServices();
    }
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    });
  };

  const saveCustom = () => {
    saveConsent(consent);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl overflow-hidden">
        {!showSettings ? (
          // Main banner - simplified and less intrusive
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  Ce site utilise des cookies pour améliorer votre expérience.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  onClick={acceptAll}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Accepter
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                >
                  Options
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Settings panel
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Paramètres des cookies</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary cookies */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <h4 className="font-medium text-foreground">Cookies nécessaires</h4>
                  <p className="text-sm text-muted-foreground">
                    Requis pour le fonctionnement du site. Ne peuvent pas être désactivés.
                  </p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Analytics cookies */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <h4 className="font-medium text-foreground">Cookies analytiques</h4>
                  <p className="text-sm text-muted-foreground">
                    Nous aident à comprendre comment vous utilisez le site.
                  </p>
                </div>
                <button
                  onClick={() => setConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    consent.analytics ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              {/* Marketing cookies */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <h4 className="font-medium text-foreground">Cookies publicitaires</h4>
                  <p className="text-sm text-muted-foreground">
                    Permettent d'afficher des publicités personnalisées (Google AdSense).
                  </p>
                </div>
                <button
                  onClick={() => setConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    consent.marketing ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={saveCustom}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enregistrer mes préférences
              </Button>
              <Button 
                onClick={acceptAll}
                variant="outline"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
