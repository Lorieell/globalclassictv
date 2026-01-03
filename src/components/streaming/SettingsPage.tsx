import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Link2, Megaphone, Palette, FolderOpen, Instagram, Youtube, Twitter, Sun, Moon, Monitor, Plus, X, Film, Tv, BookOpen, Music, Gamepad2, Mic, Globe, Sparkles, Heart, Skull, Laugh, Zap, Sword, Ghost, Rocket, Theater, Baby, Search, Mountain, Users, List, Check, Pencil, Play, RefreshCw, Loader2, Trash2, Download, Database, type LucideIcon } from 'lucide-react';
import AdvancedAdsEditor from '@/components/streaming/AdvancedAdsEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Media } from '@/types/media';

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

// Category type with icon
interface CategoryOption {
  name: string;
  icon: LucideIcon;
}

// Predefined categories with icons
const AVAILABLE_CATEGORIES: CategoryOption[] = [
  { name: 'Film', icon: Film },
  { name: 'Série', icon: Tv },
  { name: 'Anime', icon: Sparkles },
  { name: 'Documentaire', icon: BookOpen },
  { name: 'Musique', icon: Music },
  { name: 'Sport', icon: Users },
  { name: 'Jeux', icon: Gamepad2 },
  { name: 'Podcast', icon: Mic },
  { name: 'Émission', icon: Theater },
  { name: 'Enfants', icon: Baby },
  { name: 'Court-métrage', icon: Film },
  { name: 'Actualités', icon: Globe },
];

// Predefined genres with icons
const AVAILABLE_GENRES: CategoryOption[] = [
  { name: 'Action', icon: Zap },
  { name: 'Comédie', icon: Laugh },
  { name: 'Drame', icon: Heart },
  { name: 'Horreur', icon: Skull },
  { name: 'Romance', icon: Heart },
  { name: 'Sci-Fi', icon: Rocket },
  { name: 'Thriller', icon: Search },
  { name: 'Fantastique', icon: Sparkles },
  { name: 'Aventure', icon: Mountain },
  { name: 'Animation', icon: Sparkles },
  { name: 'Crime', icon: Search },
  { name: 'Mystère', icon: Ghost },
  { name: 'Guerre', icon: Sword },
  { name: 'Western', icon: Mountain },
  { name: 'Musical', icon: Music },
  { name: 'Famille', icon: Users },
  { name: 'Biographie', icon: BookOpen },
  { name: 'Histoire', icon: BookOpen },
];

interface SocialLinks {
  instagram: string;
  youtube: string;
  twitter: string;
  reddit: string;
  discord: string;
  shop: string;
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
  library?: Media[];
  onEditMedia?: (media: Media) => void;
  onAddMedia?: (media: Media) => void;
  onAddNewMedia?: () => void; // Opens editor for new media
}

const SOCIAL_STORAGE_KEY = 'gctv-social-links';
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

const defaultAppearance: AppearanceSettings = {
  theme: 'dark',
  accentColor: '#E91E8C',
};

const defaultContent: ContentSettings = {
  categories: ['Film', 'Série', 'Anime', 'Documentaire'],
  genres: ['Action', 'Comédie', 'Drame', 'Horreur', 'Romance', 'Sci-Fi', 'Thriller'],
};

type SettingsTab = 'links' | 'ads' | 'appearance' | 'content' | 'liste';


// Apply theme to document
const applyTheme = (theme: 'dark' | 'light' | 'system') => {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('light', !prefersDark);
  } else {
    root.classList.toggle('light', theme === 'light');
  }
};

// Apply accent color
const applyAccentColor = (hexColor: string) => {
  // Convert hex to HSL
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hue = Math.round(h * 360);
  const saturation = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  document.documentElement.style.setProperty('--primary', `${hue} ${saturation}% ${lightness}%`);
  document.documentElement.style.setProperty('--primary-glow', `${hue} ${saturation}% ${Math.min(lightness + 10, 100)}%`);
  document.documentElement.style.setProperty('--ring', `${hue} ${saturation}% ${lightness}%`);
};

const SettingsPage = ({ onBack, library = [], onEditMedia, onAddMedia, onAddNewMedia }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('links');
  
  // Links state
  const [links, setLinks] = useState<SocialLinks>(() => {
    const stored = localStorage.getItem(SOCIAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultLinks;
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


  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(appearance.theme);
    applyAccentColor(appearance.accentColor);
  }, []);

  const saveLinks = () => {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(links));
    toast.success('Liens sauvegardés');
  };


  const saveAppearance = () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    applyTheme(appearance.theme);
    applyAccentColor(appearance.accentColor);
    toast.success('Apparence sauvegardée');
  };

  const saveContent = () => {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new Event('gctv-content-updated'));
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
    { key: 'liste', icon: List, label: 'Liste' },
  ];

  // Liste tab state
  const [listeFilter, setListeFilter] = useState<'all' | 'with-video' | 'without-video'>('all');
  const [listeSearch, setListeSearch] = useState('');
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);

  const filteredLibrary = library.filter(media => {
    const matchesSearch = listeSearch.trim() === '' || 
      media.title.toLowerCase().includes(listeSearch.toLowerCase());
    
    const hasVideo = media.type === 'Série' 
      ? media.seasons?.some(s => s.episodes.some(e => e.videoUrls && e.videoUrls.trim() !== ''))
      : media.videoUrls && media.videoUrls.trim() !== '';
    
    if (listeFilter === 'with-video') return matchesSearch && hasVideo;
    if (listeFilter === 'without-video') return matchesSearch && !hasVideo;
    return matchesSearch;
  });

  const runDailyMaintenance = async () => {
    setIsRunningMaintenance(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-maintenance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'full', library }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        // Update localStorage with updated library
        localStorage.setItem('gctv-library', JSON.stringify(result.library));
        toast.success(result.message);
        // Reload to refresh state
        window.location.reload();
      } else {
        toast.error(result.error || 'Erreur lors de la maintenance');
      }
    } catch (error) {
      console.error('Maintenance error:', error);
      toast.error('Erreur de connexion au service de maintenance');
    } finally {
    setIsRunningMaintenance(false);
    }
  };

  // Reset library and reimport from TMDB (PRESERVE manual content)
  const handleResetAndImport = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réimporter depuis TMDB ? Vos contenus ajoutés manuellement seront conservés.')) {
      return;
    }
    
    setIsImporting(true);
    try {
      // Get manually added content to preserve
      const manualContent = library.filter(m => m.isManual || !m.id.startsWith('tmdb-'));
      
      toast.info('Import en cours... Vos contenus manuels sont préservés.');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all', pages: 5 }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Merge: keep manual content + add new TMDB content
        const tmdbContent = result.data.filter((newMedia: Media) => 
          !manualContent.some(m => m.id === newMedia.id || m.title.toLowerCase() === newMedia.title.toLowerCase())
        );
        const mergedLibrary = [...manualContent, ...tmdbContent];
        localStorage.setItem('gctv-library', JSON.stringify(mergedLibrary));
        toast.success(`${tmdbContent.length} contenus TMDB importés, ${manualContent.length} contenus manuels préservés`);
        window.location.reload();
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('TMDB import error:', error);
      toast.error('Erreur de connexion au service d\'import');
    } finally {
      setIsImporting(false);
    }
  };

  // Import TMDB content (add to existing)
  const handleImportTMDB = async () => {
    setIsImporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all', pages: 5 }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        let addedCount = 0;
        for (const media of result.data) {
          const exists = library.some(m => m.id === media.id || m.title === media.title);
          if (!exists && onAddMedia) {
            onAddMedia(media);
            addedCount++;
          }
        }
        toast.success(`${addedCount} nouveaux contenus importés depuis TMDB`);
        if (addedCount > 0) {
          window.location.reload();
        }
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('TMDB import error:', error);
      toast.error('Erreur de connexion au service d\'import');
    } finally {
      setIsImporting(false);
    }
  };

  // Check and add missing TMDB/OMDB content
  const handleCheckMissingContent = async () => {
    setIsCheckingAPI(true);
    try {
      toast.info('Vérification des contenus manquants en cours...');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all', pages: 10 }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const existingIds = new Set(library.map(m => m.id));
        const existingTitles = new Set(library.map(m => m.title.toLowerCase()));
        
        let addedCount = 0;
        for (const media of result.data) {
          const isDuplicate = existingIds.has(media.id) || existingTitles.has(media.title.toLowerCase());
          if (!isDuplicate && onAddMedia) {
            onAddMedia(media);
            addedCount++;
          }
        }
        
        if (addedCount > 0) {
          toast.success(`${addedCount} contenus manquants ajoutés depuis TMDB`);
          window.location.reload();
        } else {
          toast.success('Aucun contenu manquant détecté, la bibliothèque est à jour');
        }
      } else {
        toast.error(result.error || 'Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('API check error:', error);
      toast.error('Erreur de connexion au service de vérification');
    } finally {
      setIsCheckingAPI(false);
    }
  };

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

            {/* PUBS - New Advanced Editor */}
            {activeTab === 'ads' && <AdvancedAdsEditor />}
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
                    Sélectionnez les catégories et genres disponibles pour vos médias.
                  </p>
                </div>

                {/* Categories - selectable grid */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Catégories</h3>
                  <p className="text-sm text-muted-foreground">Cliquez pour activer/désactiver</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {AVAILABLE_CATEGORIES.map(({ name, icon: Icon }) => {
                      const isSelected = content.categories.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            if (isSelected) {
                              setContent(prev => ({ ...prev, categories: prev.categories.filter(c => c !== name) }));
                            } else {
                              setContent(prev => ({ ...prev, categories: [...prev.categories, name] }));
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-sm font-medium">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Genres - selectable grid */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Genres</h3>
                  <p className="text-sm text-muted-foreground">Cliquez pour activer/désactiver</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {AVAILABLE_GENRES.map(({ name, icon: Icon }) => {
                      const isSelected = content.genres.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            if (isSelected) {
                              setContent(prev => ({ ...prev, genres: prev.genres.filter(g => g !== name) }));
                            } else {
                              setContent(prev => ({ ...prev, genres: [...prev.genres, name] }));
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-sm font-medium">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={saveContent} className="bg-primary text-primary-foreground">
                  Enregistrer le contenu
                </Button>
              </div>
            )}

            {/* LISTE */}
            {activeTab === 'liste' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Liste des contenus</h2>
                  <p className="text-muted-foreground text-sm">
                    Gérez tous les contenus et vérifiez ceux qui ont une vidéo uploadée.
                  </p>
                </div>

                {/* Add New Media Button */}
                <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Ajouter un contenu</h3>
                      <p className="text-sm text-muted-foreground">Créer manuellement un film ou une série</p>
                    </div>
                    <Button
                      onClick={onAddNewMedia}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Plus size={16} />
                      Nouveau contenu
                    </Button>
                  </div>
                </div>

                {/* Import Buttons */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-foreground mb-3">Gestion des imports</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleResetAndImport}
                      disabled={isImporting}
                      variant="outline"
                      className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      {isImporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Réinitialiser + Import
                    </Button>
                    <Button
                      onClick={handleImportTMDB}
                      disabled={isImporting}
                      variant="outline"
                      className="gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    >
                      {isImporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      Ajouter TMDB
                    </Button>
                    <Button
                      onClick={handleCheckMissingContent}
                      disabled={isCheckingAPI}
                      variant="outline"
                      className="gap-2 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                    >
                      {isCheckingAPI ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Database size={16} />
                      )}
                      Vérifier contenus manquants
                    </Button>
                  </div>
                </div>

                {/* Maintenance Button */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Maintenance quotidienne</h3>
                      <p className="text-sm text-muted-foreground">Vérifie les langues, qualités et ajoute les nouvelles séries</p>
                    </div>
                    <Button
                      onClick={runDailyMaintenance}
                      disabled={isRunningMaintenance}
                      variant="outline"
                      className="gap-2"
                    >
                      {isRunningMaintenance ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      {isRunningMaintenance ? 'En cours...' : 'Lancer'}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        value={listeSearch}
                        onChange={(e) => setListeSearch(e.target.value)}
                        placeholder="Rechercher un contenu..."
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={listeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setListeFilter('all')}
                        size="sm"
                      >
                        Tous ({library.length})
                      </Button>
                      <Button
                        variant={listeFilter === 'with-video' ? 'default' : 'outline'}
                        onClick={() => setListeFilter('with-video')}
                        size="sm"
                        className="gap-1"
                      >
                        <Check size={14} />
                        Avec vidéo
                      </Button>
                      <Button
                        variant={listeFilter === 'without-video' ? 'default' : 'outline'}
                        onClick={() => setListeFilter('without-video')}
                        size="sm"
                        className="gap-1"
                      >
                        <X size={14} />
                        Sans vidéo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Content List */}
                <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contenu</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground w-20">Type</th>
                          <th className="text-center p-3 text-sm font-medium text-muted-foreground w-20">Vidéo</th>
                          <th className="text-center p-3 text-sm font-medium text-muted-foreground w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredLibrary.map(media => {
                          const hasVideo = media.type === 'Série' 
                            ? media.seasons?.some(s => s.episodes.some(e => e.videoUrls && e.videoUrls.trim() !== ''))
                            : media.videoUrls && media.videoUrls.trim() !== '';
                          
                          return (
                            <tr key={media.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={media.image} 
                                    alt={media.title}
                                    className="w-10 h-14 object-cover rounded"
                                  />
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{media.title}</p>
                                    <p className="text-xs text-muted-foreground">{media.language} • {media.quality}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                  media.type === 'Film' 
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {media.type === 'Film' ? <Film size={12} /> : <Tv size={12} />}
                                  {media.type}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {hasVideo ? (
                                  <div className="flex justify-center">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <Check size={14} className="text-green-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                      <X size={14} className="text-red-400" />
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditMedia?.(media)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil size={14} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredLibrary.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              Aucun contenu trouvé
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-t border-border/30 bg-muted/30">
                    <p className="text-sm text-muted-foreground text-center">
                      {filteredLibrary.length} contenu{filteredLibrary.length > 1 ? 's' : ''} affiché{filteredLibrary.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
