import { useState, useEffect } from 'react';
import { ArrowLeft, Link2, Megaphone, Instagram, Youtube, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Reddit icon
const RedditIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

// Discord icon
const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

interface SocialLinks {
  instagram: string;
  youtube: string;
  twitter: string;
  reddit: string;
  discord: string;
  shop: string;
}

interface AdSettings {
  leftEnabled: boolean;
  leftImageUrl: string;
  leftLinkUrl: string;
  rightEnabled: boolean;
  rightImageUrl: string;
  rightLinkUrl: string;
}

interface SettingsPageProps {
  onBack: () => void;
}

const SOCIAL_STORAGE_KEY = 'gctv-social-links';
const ADS_STORAGE_KEY = 'gctv-ads-settings';

const defaultLinks: SocialLinks = {
  instagram: 'https://instagram.com',
  youtube: 'https://youtube.com',
  twitter: 'https://twitter.com',
  reddit: 'https://reddit.com',
  discord: 'https://discord.gg',
  shop: 'https://globaldealr.com',
};

const defaultAds: AdSettings = {
  leftEnabled: false,
  leftImageUrl: '',
  leftLinkUrl: '',
  rightEnabled: false,
  rightImageUrl: '',
  rightLinkUrl: '',
};

type SettingsTab = 'links' | 'ads';

const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('links');
  
  // Links state
  const [links, setLinks] = useState<SocialLinks>(() => {
    const stored = localStorage.getItem(SOCIAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultLinks;
  });

  // Ads state
  const [ads, setAds] = useState<AdSettings>(() => {
    const stored = localStorage.getItem(ADS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultAds;
  });

  const saveLinks = () => {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(links));
    toast.success('Liens sauvegardés');
  };

  const saveAds = () => {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
    toast.success('Paramètres des pubs sauvegardés');
  };

  const socialItems = [
    { key: 'instagram', icon: Instagram, label: 'Instagram' },
    { key: 'youtube', icon: Youtube, label: 'YouTube' },
    { key: 'twitter', icon: Twitter, label: 'Twitter' },
    { key: 'reddit', icon: RedditIcon, label: 'Reddit' },
    { key: 'discord', icon: DiscordIcon, label: 'Discord' },
  ];

  const menuItems = [
    { key: 'links', icon: Link2, label: 'Liens' },
    { key: 'ads', icon: Megaphone, label: 'Pubs' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">Paramètres</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <nav className="space-y-1">
              {menuItems.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === 'links' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Liens du footer</h2>
                  <p className="text-muted-foreground text-sm">
                    Configurez les liens vers vos réseaux sociaux et votre boutique.
                  </p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-5">
                  {socialItems.map(({ key, icon: Icon, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-foreground flex items-center gap-2">
                        <Icon size={16} />
                        {label}
                      </Label>
                      <Input
                        value={links[key as keyof SocialLinks]}
                        onChange={(e) => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`URL ${label}`}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <Label className="text-foreground">Shop (GlobalDealr)</Label>
                      <Input
                        value={links.shop}
                        onChange={(e) => setLinks(prev => ({ ...prev, shop: e.target.value }))}
                        placeholder="URL du shop"
                        className="bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={saveLinks} className="bg-primary text-primary-foreground">
                  Enregistrer les liens
                </Button>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Publicités</h2>
                  <p className="text-muted-foreground text-sm">
                    Configurez les publicités affichées sur les côtés de la page détails.
                  </p>
                </div>

                {/* Left Ad */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Publicité gauche</h3>
                      <p className="text-sm text-muted-foreground">Affichée à gauche de la page détails</p>
                    </div>
                    <Switch
                      checked={ads.leftEnabled}
                      onCheckedChange={(checked) => setAds(prev => ({ ...prev, leftEnabled: checked }))}
                    />
                  </div>

                  {ads.leftEnabled && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        <Label className="text-foreground">URL de l'image</Label>
                        <Input
                          value={ads.leftImageUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, leftImageUrl: e.target.value }))}
                          placeholder="https://example.com/pub.png"
                          className="bg-muted/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">URL de redirection (au clic)</Label>
                        <Input
                          value={ads.leftLinkUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, leftLinkUrl: e.target.value }))}
                          placeholder="https://example.com"
                          className="bg-muted/50 border-border"
                        />
                      </div>
                      {ads.leftImageUrl && (
                        <div className="pt-2">
                          <Label className="text-foreground mb-2 block">Aperçu</Label>
                          <div className="w-[120px] bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                            <img 
                              src={ads.leftImageUrl} 
                              alt="Aperçu pub gauche" 
                              className="w-full h-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="200"><rect fill="%23333" width="120" height="200"/><text fill="%23666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">Erreur</text></svg>';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Ad */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Publicité droite</h3>
                      <p className="text-sm text-muted-foreground">Affichée à droite de la page détails</p>
                    </div>
                    <Switch
                      checked={ads.rightEnabled}
                      onCheckedChange={(checked) => setAds(prev => ({ ...prev, rightEnabled: checked }))}
                    />
                  </div>

                  {ads.rightEnabled && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        <Label className="text-foreground">URL de l'image</Label>
                        <Input
                          value={ads.rightImageUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, rightImageUrl: e.target.value }))}
                          placeholder="https://example.com/pub.png"
                          className="bg-muted/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">URL de redirection (au clic)</Label>
                        <Input
                          value={ads.rightLinkUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, rightLinkUrl: e.target.value }))}
                          placeholder="https://example.com"
                          className="bg-muted/50 border-border"
                        />
                      </div>
                      {ads.rightImageUrl && (
                        <div className="pt-2">
                          <Label className="text-foreground mb-2 block">Aperçu</Label>
                          <div className="w-[120px] bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                            <img 
                              src={ads.rightImageUrl} 
                              alt="Aperçu pub droite" 
                              className="w-full h-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="200"><rect fill="%23333" width="120" height="200"/><text fill="%23666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">Erreur</text></svg>';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button onClick={saveAds} className="bg-primary text-primary-foreground">
                  Enregistrer les pubs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
