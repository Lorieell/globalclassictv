import { useState, useEffect } from 'react';
import { ArrowLeft, Link2, Megaphone, Palette, FolderOpen, Instagram, Youtube, Twitter, Sun, Moon, Monitor, Plus, X } from 'lucide-react';
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

interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
}

interface ContentSettings {
  categories: string[];
  genres: string[];
}

interface SettingsPageProps {
  onBack: () => void;
}

const SOCIAL_STORAGE_KEY = 'gctv-social-links';
const ADS_STORAGE_KEY = 'gctv-ads-settings';
const APPEARANCE_STORAGE_KEY = 'gctv-appearance';
const CONTENT_STORAGE_KEY = 'gctv-content-settings';

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

const defaultAppearance: AppearanceSettings = {
  theme: 'dark',
  accentColor: '#E91E8C',
};

const defaultContent: ContentSettings = {
  categories: ['Film', 'Série', 'Anime', 'Documentaire'],
  genres: ['Action', 'Comédie', 'Drame', 'Horreur', 'Romance', 'Sci-Fi', 'Thriller'],
};

type SettingsTab = 'links' | 'ads' | 'appearance' | 'content';

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

  // Appearance state
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultAppearance;
  });

  // Content state
  const [content, setContent] = useState<ContentSettings>(() => {
    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultContent;
  });

  const [newCategory, setNewCategory] = useState('');
  const [newGenre, setNewGenre] = useState('');

  const saveLinks = () => {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(links));
    toast.success('Liens sauvegardés');
  };

  const saveAds = () => {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
    toast.success('Paramètres des pubs sauvegardés');
  };

  const saveAppearance = () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    // Apply theme
    if (appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    toast.success('Apparence sauvegardée');
  };

  const saveContent = () => {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    toast.success('Contenu sauvegardé');
  };

  const addCategory = () => {
    if (newCategory.trim() && !content.categories.includes(newCategory.trim())) {
      setContent(prev => ({ ...prev, categories: [...prev.categories, newCategory.trim()] }));
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setContent(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };

  const addGenre = () => {
    if (newGenre.trim() && !content.genres.includes(newGenre.trim())) {
      setContent(prev => ({ ...prev, genres: [...prev.genres, newGenre.trim()] }));
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setContent(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
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
    { key: 'appearance', icon: Palette, label: 'Apparence' },
    { key: 'content', icon: FolderOpen, label: 'Contenu' },
  ];

  const themeOptions = [
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'system', label: 'Système', icon: Monitor },
  ];

  const accentColors = [
    { value: '#E91E8C', label: 'Rose' },
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#3B82F6', label: 'Bleu' },
    { value: '#10B981', label: 'Vert' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Rouge' },
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
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {menuItems.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as SettingsTab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 whitespace-nowrap ${
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
            {/* LIENS */}
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

            {/* PUBS */}
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
                        <Label className="text-foreground">URL de redirection</Label>
                        <Input
                          value={ads.leftLinkUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, leftLinkUrl: e.target.value }))}
                          placeholder="https://example.com"
                          className="bg-muted/50 border-border"
                        />
                      </div>
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
                        <Label className="text-foreground">URL de redirection</Label>
                        <Input
                          value={ads.rightLinkUrl}
                          onChange={(e) => setAds(prev => ({ ...prev, rightLinkUrl: e.target.value }))}
                          placeholder="https://example.com"
                          className="bg-muted/50 border-border"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={saveAds} className="bg-primary text-primary-foreground">
                  Enregistrer les pubs
                </Button>
              </div>
            )}

            {/* APPARENCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Apparence</h2>
                  <p className="text-muted-foreground text-sm">
                    Personnalisez le thème et les couleurs du site.
                  </p>
                </div>

                {/* Theme Selection */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Thème</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setAppearance(prev => ({ ...prev, theme: value as 'dark' | 'light' | 'system' }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          appearance.theme === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Couleur d'accent</h3>
                  <div className="flex flex-wrap gap-3">
                    {accentColors.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setAppearance(prev => ({ ...prev, accentColor: value }))}
                        className={`w-12 h-12 rounded-full border-4 transition-all ${
                          appearance.accentColor === value
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: value }}
                        title={label}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={saveAppearance} className="bg-primary text-primary-foreground">
                  Enregistrer l'apparence
                </Button>
              </div>
            )}

            {/* CONTENU */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Contenu</h2>
                  <p className="text-muted-foreground text-sm">
                    Gérez les catégories et les genres disponibles pour vos médias.
                  </p>
                </div>

                {/* Categories */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Catégories</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.categories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm"
                      >
                        {cat}
                        <button
                          onClick={() => removeCategory(cat)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nouvelle catégorie"
                      className="bg-muted/50 border-border"
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <Button onClick={addCategory} size="icon" variant="outline">
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>

                {/* Genres */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.genres.map(genre => (
                      <span
                        key={genre}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-foreground border border-border/50 text-sm"
                      >
                        {genre}
                        <button
                          onClick={() => removeGenre(genre)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      placeholder="Nouveau genre"
                      className="bg-muted/50 border-border"
                      onKeyDown={(e) => e.key === 'Enter' && addGenre()}
                    />
                    <Button onClick={addGenre} size="icon" variant="outline">
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>

                <Button onClick={saveContent} className="bg-primary text-primary-foreground">
                  Enregistrer le contenu
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
