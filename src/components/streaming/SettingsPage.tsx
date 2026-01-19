import { useState, useEffect, useCallback, forwardRef, useMemo, useRef } from 'react';
import { ArrowLeft, Link2, Megaphone, Palette, FolderOpen, Instagram, Youtube, Twitter, Sun, Moon, Monitor, Plus, X, Film, Tv, BookOpen, Music, Gamepad2, Mic, Globe, Sparkles, Heart, Skull, Laugh, Zap, Sword, Ghost, Rocket, Theater, Baby, Search, Mountain, Users, List, Check, Pencil, Play, RefreshCw, Loader2, Trash2, Download, Database, Star, Clock, BarChart3, Bell, type LucideIcon } from 'lucide-react';
import AdvancedAdsEditor from '@/components/streaming/AdvancedAdsEditor';
import AdStatsPanel from '@/components/streaming/AdStatsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Media } from '@/types/media';

// Reddit icon - forwardRef to prevent ref warning
const RedditIcon = forwardRef<SVGSVGElement, { size?: number }>(({ size = 20 }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
));
RedditIcon.displayName = 'RedditIcon';

// Discord icon - forwardRef to prevent ref warning
const DiscordIcon = forwardRef<SVGSVGElement, { size?: number }>(({ size = 20 }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
));
DiscordIcon.displayName = 'DiscordIcon';

// Category type with icon
interface CategoryOption {
  name: string;
  icon: LucideIcon;
}

// Predefined categories with icons
const AVAILABLE_CATEGORIES: CategoryOption[] = [
  { name: 'Film', icon: Film },
  { name: 'Série', icon: Tv },
  { name: 'Animé', icon: Sparkles },
  { name: 'Documentaire', icon: BookOpen },
  { name: 'Émission', icon: Theater },
  { name: 'Musique', icon: Music },
  { name: 'Sport', icon: Users },
  { name: 'Jeux', icon: Gamepad2 },
  { name: 'Podcast', icon: Mic },
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
  cardStyle: 'rounded' | 'sharp' | 'pill';
  animationsEnabled: boolean;
  compactMode: boolean;
  showRatings: boolean;
  autoplayTrailers: boolean;
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
  onDeleteMedia?: (id: string) => void;
  onToggleFeatured?: (id: string, isFeatured: boolean) => void;
  onToggleOngoing?: (id: string, isOngoing: boolean) => void;
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
  cardStyle: 'rounded',
  animationsEnabled: true,
  compactMode: false,
  showRatings: true,
  autoplayTrailers: false,
};

const defaultContent: ContentSettings = {
  categories: ['Film', 'Série', 'Anime', 'Documentaire'],
  genres: ['Action', 'Comédie', 'Drame', 'Horreur', 'Romance', 'Sci-Fi', 'Thriller'],
};

type SettingsTab = 'links' | 'ads' | 'stats' | 'appearance' | 'content' | 'liste' | 'update';


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

// Notification Manager Component (Create + History + Delete + Images)
const NotificationManager = () => {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'update' | 'bugfix' | 'new_content' | 'new_video'>('update');
  const [notifImage, setNotifImage] = useState<File | null>(null);
  const [notifImagePreview, setNotifImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    image_url: string | null;
    created_at: string;
  }>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sent notifications
  const fetchSentNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, image_url, created_at')
      .is('session_id', null)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setSentNotifications(data);
    }
  };

  useEffect(() => {
    fetchSentNotifications();
  }, []);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image trop grande (max 5 Mo)');
        return;
      }
      setNotifImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNotifImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setNotifImage(null);
    setNotifImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('Titre et message requis');
      return;
    }

    setIsSending(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (notifImage) {
        const fileExt = notifImage.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('notification-images')
          .upload(fileName, notifImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Erreur lors de l\'upload de l\'image');
          setIsSending(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('notification-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('notifications').insert({
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        image_url: imageUrl,
        session_id: null,
        user_id: null,
        is_read: false,
      });

      if (error) {
        console.error('Error creating notification:', error);
        toast.error('Erreur lors de la création');
        return;
      }

      toast.success('Notification envoyée à tous les utilisateurs !');
      setNotifTitle('');
      setNotifMessage('');
      clearImage();
      fetchSentNotifications();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const deleteNotification = async (id: string, imageUrl: string | null) => {
    setDeletingId(id);
    try {
      // Delete image from storage if exists
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('notification-images').remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success('Notification supprimée');
      setSentNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'update': return '📢 Mise à jour';
      case 'bugfix': return '🐛 Bug fix';
      case 'new_content': return '✨ Nouveau contenu';
      case 'new_video': return '🎬 Nouvelle vidéo';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Create notification form */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Titre</Label>
            <Input
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Ex: Nouveaux films ajoutés !"
              className="bg-muted/50"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <select
              value={notifType}
              onChange={(e) => setNotifType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-foreground text-sm"
            >
              <option value="update">📢 Mise à jour</option>
              <option value="new_content">✨ Nouveau contenu</option>
              <option value="new_video">🎬 Nouvelle vidéo</option>
              <option value="bugfix">🐛 Correction de bug</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Message</Label>
          <textarea
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
            placeholder="Ex: 50 nouveaux films et séries ont été ajoutés cette semaine ! Découvrez les dernières nouveautés..."
            className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm resize-y"
            rows={3}
          />
        </div>
        
        {/* Image upload */}
        <div>
          <Label className="text-xs text-muted-foreground">Image (optionnel)</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Plus size={14} />
              Ajouter une image
            </Button>
            {notifImagePreview && (
              <div className="relative">
                <img 
                  src={notifImagePreview} 
                  alt="Preview" 
                  className="h-10 w-16 object-cover rounded border border-border"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={sendNotification}
            disabled={isSending || !notifTitle.trim() || !notifMessage.trim()}
            size="sm"
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Megaphone size={14} />
                Envoyer la notification
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <Bell size={14} />
            {showHistory ? 'Masquer historique' : `Historique (${sentNotifications.length})`}
          </Button>
        </div>
      </div>

      {/* Notification History */}
      {showHistory && sentNotifications.length > 0 && (
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <div className="bg-secondary/30 px-4 py-2 border-b border-border/30">
            <h4 className="text-sm font-medium text-foreground">Notifications envoyées</h4>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border/20">
            {sentNotifications.map((notif) => (
              <div key={notif.id} className="p-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {notif.image_url && (
                      <img 
                        src={notif.image_url} 
                        alt="" 
                        className="w-12 h-12 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                          {getTypeLabel(notif.type)}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>
                      <h5 className="text-sm font-medium text-foreground truncate">{notif.title}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteNotification(notif.id, notif.image_url)}
                    disabled={deletingId === notif.id}
                  >
                    {deletingId === notif.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = ({ onBack, library = [], onEditMedia, onAddMedia, onAddNewMedia, onDeleteMedia, onToggleFeatured, onToggleOngoing }: SettingsPageProps) => {
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
    window.dispatchEvent(new Event('gctv-social-updated'));
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
    { key: 'stats', icon: BarChart3, label: 'Stats' },
    { key: 'appearance', icon: Palette, label: 'Apparence' },
    { key: 'content', icon: FolderOpen, label: 'Contenu' },
    { key: 'liste', icon: List, label: 'Liste' },
    { key: 'update', icon: RefreshCw, label: 'Mise à jour' },
  ];

  // Liste tab state
  const [listeFilter, setListeFilter] = useState<'all' | 'with-video' | 'without-video' | 'popular' | 'ongoing'>('all');
  const [listeSearch, setListeSearch] = useState('');
  const [listeYearFilter, setListeYearFilter] = useState<string>('all');
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);
  const [isRefreshingLayout, setIsRefreshingLayout] = useState(false);
  const [isDeletingAsian, setIsDeletingAsian] = useState(false);
  const [isDeletingFree, setIsDeletingFree] = useState(false);
  const [isDeletingQuebec, setIsDeletingQuebec] = useState(false);
  // Multi-select for bulk actions
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const popularCount = library.filter(m => (m as any).isFeatured).length;
  const ongoingCount = library.filter(m => (m as any).isOngoing).length;

  // Get all unique years from library
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    library.forEach(m => {
      const year = (m as any).year;
      if (year) years.add(String(year));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [library]);

  const filteredLibrary = library.filter(media => {
    const matchesSearch = listeSearch.trim() === '' || 
      media.title.toLowerCase().includes(listeSearch.toLowerCase());
    
    const matchesYear = listeYearFilter === 'all' || String((media as any).year) === listeYearFilter;
    
    const hasVideo = media.type === 'Série' 
      ? media.seasons?.some(s => s.episodes.some(e => e.videoUrls && e.videoUrls.trim() !== ''))
      : media.videoUrls && media.videoUrls.trim() !== '';
    
    if (listeFilter === 'popular') return matchesSearch && matchesYear && (media as any).isFeatured;
    if (listeFilter === 'ongoing') return matchesSearch && matchesYear && (media as any).isOngoing;
    if (listeFilter === 'with-video') return matchesSearch && matchesYear && hasVideo;
    if (listeFilter === 'without-video') return matchesSearch && matchesYear && !hasVideo;
    return matchesSearch && matchesYear;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLibrary.length / ITEMS_PER_PAGE);
  const paginatedLibrary = filteredLibrary.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [listeFilter, listeSearch, listeYearFilter]);

  // Toggle selection for a media item
  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  // Select all visible items
  const selectAllVisible = () => {
    setSelectedMediaIds(new Set(paginatedLibrary.map(m => m.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedMediaIds(new Set());
  };

  // Bulk mark as popular
  const bulkMarkAsPopular = async (popular: boolean) => {
    const ids = Array.from(selectedMediaIds);
    for (const id of ids) {
      await onToggleFeatured?.(id, popular);
    }
    toast.success(`${ids.length} contenu(s) ${popular ? 'marqués comme populaires' : 'retirés des populaires'}`);
    setSelectedMediaIds(new Set());
    setIsSelectMode(false);
  };

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

  // Get auth token for API calls
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Reset library and reimport from TMDB - saves directly to Supabase
  const handleResetAndImport = async () => {
    if (!confirm('Êtes-vous sûr de vouloir importer depuis TMDB ? Les contenus existants seront conservés, seuls les nouveaux seront ajoutés.')) {
      return;
    }
    
    setIsImporting(true);
    try {
      toast.info('Import en cours... Cela peut prendre quelques minutes.');
      
      const token = await getAuthToken();
      if (!token) {
        toast.error('Vous devez être connecté en tant qu\'admin pour importer');
        setIsImporting(false);
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'all', pages: 5, saveToDb: true }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || `${result.saved} nouveaux contenus importés`);
        // Refresh page to load new data
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

  // Quick import - add new content only
  const handleImportTMDB = async () => {
    setIsImporting(true);
    try {
      toast.info('Recherche de nouveaux contenus TMDB...');
      
      const token = await getAuthToken();
      if (!token) {
        toast.error('Vous devez être connecté en tant qu\'admin pour importer');
        setIsImporting(false);
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'all', pages: 3, saveToDb: true }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || `${result.saved} nouveaux contenus importés`);
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

  // Check and add missing TMDB content
  const handleCheckMissingContent = async () => {
    setIsCheckingAPI(true);
    try {
      toast.info('Vérification des contenus manquants...');
      
      const token = await getAuthToken();
      if (!token) {
        toast.error('Vous devez être connecté en tant qu\'admin pour vérifier les contenus');
        setIsCheckingAPI(false);
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'all', pages: 10, saveToDb: true }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        if (result.saved > 0) {
          toast.success(`${result.saved} contenus manquants ajoutés`);
          window.location.reload();
        } else {
          toast.success('Aucun contenu manquant, la bibliothèque est à jour');
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

  // Delete Asian content without French titles
  const handleDeleteAsianContent = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les contenus asiatiques (chinois, coréens, japonais) sans titre français ? Cette action est irréversible.')) {
      return;
    }
    
    setIsDeletingAsian(true);
    try {
      // Pattern to detect CJK characters
      const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
      
      // Find all media with Asian titles (CJK characters in title)
      const asianMedia = library.filter(m => cjkPattern.test(m.title));
      
      if (asianMedia.length === 0) {
        toast.info('Aucun contenu asiatique à supprimer');
        setIsDeletingAsian(false);
        return;
      }
      
      // Delete each one
      let deleted = 0;
      for (const media of asianMedia) {
        await onDeleteMedia?.(media.id);
        deleted++;
      }
      
      toast.success(`${deleted} contenus asiatiques supprimés`);
      window.location.reload();
    } catch (error) {
      console.error('Delete Asian content error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeletingAsian(false);
    }
  };

  // Delete free accessible content (documentaries, emissions, etc.)
  const handleDeleteFreeContent = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer les contenus gratuits (documentaires, émissions TV) ? Cette action est irréversible.')) {
      return;
    }
    
    setIsDeletingFree(true);
    try {
      // Find free content: documentaries, emissions, reality shows
      const freeContent = library.filter(m => {
        const genres = m.genres?.toLowerCase() || '';
        const type = m.type?.toLowerCase() || '';
        return (
          type === 'documentaire' ||
          type === 'émission' ||
          genres.includes('document') ||
          genres.includes('reality') ||
          genres.includes('talk') ||
          genres.includes('news') ||
          genres.includes('game show')
        );
      });
      
      if (freeContent.length === 0) {
        toast.info('Aucun contenu gratuit à supprimer');
        setIsDeletingFree(false);
        return;
      }
      
      let deleted = 0;
      for (const media of freeContent) {
        await onDeleteMedia?.(media.id);
        deleted++;
      }
      
      toast.success(`${deleted} contenus gratuits supprimés`);
      window.location.reload();
    } catch (error) {
      console.error('Delete free content error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeletingFree(false);
    }
  };

  // Delete Quebec French content
  const handleDeleteQuebecContent = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer les contenus en français québécois ? Seuls VF (France) et VOSTFR seront conservés.')) {
      return;
    }
    
    setIsDeletingQuebec(true);
    try {
      // Find Quebec French content
      const quebecContent = library.filter(m => {
        const lang = m.language?.toLowerCase() || '';
        return (
          lang.includes('canada') ||
          lang.includes('québec') ||
          lang.includes('quebec') ||
          lang === 'fr-ca'
        );
      });
      
      if (quebecContent.length === 0) {
        toast.info('Aucun contenu québécois à supprimer');
        setIsDeletingQuebec(false);
        return;
      }
      
      let deleted = 0;
      for (const media of quebecContent) {
        await onDeleteMedia?.(media.id);
        deleted++;
      }
      
      toast.success(`${deleted} contenus québécois supprimés`);
      window.location.reload();
    } catch (error) {
      console.error('Delete Quebec content error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeletingQuebec(false);
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
    { value: '#10B981', label: 'Émeraude' },
    { value: '#F59E0B', label: 'Ambre' },
    { value: '#EF4444', label: 'Rouge' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#14B8A6', label: 'Turquoise' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EC4899', label: 'Fuchsia' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#84CC16', label: 'Lime' },
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

            {/* STATS - Ad Performance Statistics */}
            {activeTab === 'stats' && <AdStatsPanel />}
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

                {/* Card Style */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Style des cartes</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'rounded', label: 'Arrondies', preview: 'rounded-2xl' },
                      { value: 'sharp', label: 'Carrées', preview: 'rounded-none' },
                      { value: 'pill', label: 'Pilules', preview: 'rounded-3xl' },
                    ].map(({ value, label, preview }) => (
                      <button
                        key={value}
                        onClick={() => setAppearance(prev => ({ ...prev, cardStyle: value as 'rounded' | 'sharp' | 'pill' }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          appearance.cardStyle === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <div className={`w-12 h-16 bg-muted/50 ${preview} border border-border`} />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Options d'affichage</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Animations</p>
                        <p className="text-sm text-muted-foreground">Activer les animations et transitions</p>
                      </div>
                      <Switch
                        checked={appearance.animationsEnabled}
                        onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, animationsEnabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Mode compact</p>
                        <p className="text-sm text-muted-foreground">Réduire l'espacement entre les éléments</p>
                      </div>
                      <Switch
                        checked={appearance.compactMode}
                        onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, compactMode: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Afficher les notes</p>
                        <p className="text-sm text-muted-foreground">Montrer les étoiles de notation sur les cartes</p>
                      </div>
                      <Switch
                        checked={appearance.showRatings}
                        onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, showRatings: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Lecture auto des bandes-annonces</p>
                        <p className="text-sm text-muted-foreground">Lire automatiquement les trailers au survol</p>
                      </div>
                      <Switch
                        checked={appearance.autoplayTrailers}
                        onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, autoplayTrailers: checked }))}
                      />
                    </div>
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

                {/* Actions rapides */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-500" />
                    Actions rapides
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={async () => {
                        // Force popular sort - reorder featured media first in all categories
                        const featuredMedia = library.filter((m: any) => m.isFeatured);
                        if (featuredMedia.length === 0) {
                          toast.error('Aucun contenu marqué comme populaire');
                          return;
                        }
                        
                        // Dispatch event for Index.tsx to reorder
                        window.dispatchEvent(new Event('gctv-force-popular-sort'));
                        toast.success(`${featuredMedia.length} contenus populaires triés en premier`);
                        setTimeout(() => window.location.reload(), 500);
                      }}
                      variant="outline"
                      className="gap-2 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                    >
                      <Star size={16} className="fill-yellow-500" />
                      Forcer tri populaires ({popularCount})
                    </Button>
                    <Button
                      onClick={async () => {
                        // Force regenerate hero slides: half popular (featured), half random
                        const token = await getAuthToken();
                        if (!token) {
                          toast.error('Vous devez être connecté en tant qu\'admin');
                          return;
                        }
                        
                        // Get media with video and backdrop for hero
                        const eligibleMedia = library.filter(m => {
                          const hasVideo = m.type === 'Série' 
                            ? m.seasons?.some(s => s.episodes?.some(e => e.videoUrls?.trim()))
                            : !!(m.videoUrls?.trim());
                          const hasBackdrop = !!(m as any).backdrop;
                          return hasVideo && hasBackdrop;
                        });
                        
                        if (eligibleMedia.length < 3) {
                          toast.error('Pas assez de contenus avec vidéo et image horizontale pour les hero slides');
                          return;
                        }
                        
                        // Get featured (popular) media with video
                        const featuredEligible = eligibleMedia.filter((m: any) => m.isFeatured);
                        const nonFeaturedEligible = eligibleMedia.filter((m: any) => !m.isFeatured);
                        
                        // Take half featured, half random
                        const numFeatured = Math.min(3, featuredEligible.length);
                        const numRandom = 6 - numFeatured;
                        
                        const selectedFeatured = featuredEligible.slice(0, numFeatured);
                        const shuffledRandom = [...nonFeaturedEligible]
                          .sort(() => Math.random() - 0.5)
                          .slice(0, numRandom);
                        
                        // Interleave: featured, random, featured, random...
                        const heroMediaList: Media[] = [];
                        for (let i = 0; i < Math.max(selectedFeatured.length, shuffledRandom.length); i++) {
                          if (i < selectedFeatured.length) heroMediaList.push(selectedFeatured[i]);
                          if (i < shuffledRandom.length) heroMediaList.push(shuffledRandom[i]);
                        }
                        
                        // Delete existing hero items and insert new ones
                        const { error: deleteError } = await supabase
                          .from('hero_items')
                          .delete()
                          .neq('id', '00000000-0000-0000-0000-000000000000');
                        
                        if (deleteError) {
                          console.error('Error deleting hero items:', deleteError);
                        }
                        
                        // Insert new hero items using BACKDROP (horizontal) image
                        const newHeroItems = heroMediaList.slice(0, 6).map((m, index) => ({
                          media_id: m.id,
                          title: m.title.toUpperCase(),
                          description: m.description || m.synopsis || '',
                          // CRITICAL: Use backdrop_url (horizontal) NOT poster_url (vertical)
                          image_url: (m as any).backdrop || m.image,
                          sort_order: index,
                          is_active: true,
                          duration: 30,
                        }));
                        
                        const { error: insertError } = await supabase
                          .from('hero_items')
                          .insert(newHeroItems);
                        
                        if (insertError) {
                          toast.error('Erreur lors de la mise à jour des slides');
                          console.error('Error inserting hero items:', insertError);
                        } else {
                          toast.success(`${newHeroItems.length} hero slides générés (${numFeatured} populaires, ${numRandom} aléatoires)`);
                          window.dispatchEvent(new Event('gctv-force-hero-rotation'));
                          setTimeout(() => window.location.reload(), 1000);
                        }
                      }}
                      variant="outline"
                      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <RefreshCw size={16} />
                      Forcer rotation slides
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ces actions forcent la mise à jour immédiate du tri et de la rotation.
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

                {/* Delete Asian Content Button */}
                <div className="bg-card/50 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Supprimer contenus asiatiques sans VF</h3>
                      <p className="text-sm text-muted-foreground">Supprime les films/séries chinois, coréens, japonais sans titre français</p>
                    </div>
                    <Button
                      onClick={handleDeleteAsianContent}
                      disabled={isDeletingAsian}
                      variant="outline"
                      className="gap-2 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                    >
                      {isDeletingAsian ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </div>

                {/* Delete Free Content Button */}
                <div className="bg-card/50 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Supprimer contenus gratuits</h3>
                      <p className="text-sm text-muted-foreground">Supprime les documentaires, émissions TV et séries accessibles gratuitement</p>
                    </div>
                    <Button
                      onClick={handleDeleteFreeContent}
                      disabled={isDeletingFree}
                      variant="outline"
                      className="gap-2 border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                    >
                      {isDeletingFree ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </div>

                {/* Delete Quebec French Content Button */}
                <div className="bg-card/50 border border-cyan-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Supprimer contenus French (Canada)</h3>
                      <p className="text-sm text-muted-foreground">Supprime les contenus en français québécois (garde VF et VOSTFR uniquement)</p>
                    </div>
                    <Button
                      onClick={handleDeleteQuebecContent}
                      disabled={isDeletingQuebec}
                      variant="outline"
                      className="gap-2 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
                    >
                      {isDeletingQuebec ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </div>

                {/* Maintenance Button */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Maintenance quotidienne</h3>
                      <p className="text-sm text-muted-foreground">Met à jour toutes les infos: budget, recettes, acteurs, réalisateurs, genres, etc.</p>
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
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search input - takes most space */}
                    <div className="flex-1 min-w-0">
                      <Input
                        value={listeSearch}
                        onChange={(e) => setListeSearch(e.target.value)}
                        placeholder="Rechercher un contenu..."
                        className="bg-muted/50 border-border w-full"
                      />
                    </div>
                    
                    {/* Year filter - compact */}
                    <select
                      value={listeYearFilter}
                      onChange={(e) => setListeYearFilter(e.target.value)}
                      className="bg-muted/50 border border-border rounded-lg px-2 py-2 text-sm text-foreground w-auto min-w-[100px]"
                    >
                      <option value="all">Année</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Filter buttons row */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={listeFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setListeFilter('all')}
                      size="sm"
                    >
                      Tous ({library.length})
                    </Button>
                    <Button
                      variant={listeFilter === 'popular' ? 'default' : 'outline'}
                      onClick={() => setListeFilter('popular')}
                      size="sm"
                      className="gap-1"
                    >
                      <Star size={14} />
                      Populaires ({popularCount})
                    </Button>
                    <Button
                      variant={listeFilter === 'ongoing' ? 'default' : 'outline'}
                      onClick={() => setListeFilter('ongoing')}
                      size="sm"
                      className="gap-1"
                    >
                      <Clock size={14} />
                      En cours ({ongoingCount})
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

                  {/* Multi-select controls */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                    <Button
                      variant={isSelectMode ? 'default' : 'outline'}
                      onClick={() => {
                        setIsSelectMode(!isSelectMode);
                        if (isSelectMode) deselectAll();
                      }}
                      size="sm"
                      className="gap-2"
                    >
                      <Check size={14} />
                      {isSelectMode ? 'Mode sélection actif' : 'Sélection multiple'}
                    </Button>

                    {isSelectMode && (
                      <>
                        <Button
                          variant="outline"
                          onClick={selectAllVisible}
                          size="sm"
                        >
                          Tout sélectionner ({paginatedLibrary.length})
                        </Button>
                        {selectedMediaIds.size > 0 && (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {selectedMediaIds.size} sélectionné(s)
                            </span>
                            <Button
                              onClick={() => bulkMarkAsPopular(true)}
                              size="sm"
                              className="gap-1 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/30"
                              variant="outline"
                            >
                              <Star size={14} className="fill-yellow-500" />
                              Marquer populaires
                            </Button>
                            <Button
                              onClick={() => bulkMarkAsPopular(false)}
                              size="sm"
                              variant="outline"
                              className="gap-1"
                            >
                              <X size={14} />
                              Retirer populaires
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Content List */}
                <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          {isSelectMode && (
                            <th className="w-10 p-3">
                              <input 
                                type="checkbox" 
                                checked={paginatedLibrary.length > 0 && paginatedLibrary.every(m => selectedMediaIds.has(m.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    selectAllVisible();
                                  } else {
                                    deselectAll();
                                  }
                                }}
                                className="w-4 h-4 accent-primary rounded"
                              />
                            </th>
                          )}
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contenu</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground w-20">Type</th>
                          <th className="text-center p-3 text-sm font-medium text-muted-foreground w-20">Vidéo</th>
                          <th className="text-center p-3 text-sm font-medium text-muted-foreground w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {paginatedLibrary.map(media => {
                          const hasVideo = media.type === 'Série' 
                            ? media.seasons?.some(s => s.episodes.some(e => e.videoUrls && e.videoUrls.trim() !== ''))
                            : media.videoUrls && media.videoUrls.trim() !== '';
                          const isFeatured = (media as any).isFeatured || false;
                          const isOngoing = (media as any).isOngoing || false;
                          const isSelected = selectedMediaIds.has(media.id);
                          
                          return (
                            <tr 
                              key={media.id} 
                              className={`transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/20'}`}
                              onClick={isSelectMode ? () => toggleMediaSelection(media.id) : undefined}
                            >
                              {isSelectMode && (
                                <td className="p-3">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => toggleMediaSelection(media.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 accent-primary rounded"
                                  />
                                </td>
                              )}
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img 
                                      src={media.image} 
                                      alt={media.title}
                                      loading="lazy"
                                      className="w-10 h-14 object-cover rounded"
                                    />
                                    {isFeatured && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <Star size={10} className="text-black fill-black" />
                                      </div>
                                    )}
                                  </div>
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
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditMedia?.(media)}
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                    title="Modifier"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Supprimer "${media.title}" ?`)) {
                                        onDeleteMedia?.(media.id);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleFeatured?.(media.id, !isFeatured)}
                                    className={`h-8 w-8 p-0 ${
                                      isFeatured 
                                        ? 'text-yellow-500 hover:text-yellow-400 bg-yellow-500/10' 
                                        : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
                                    }`}
                                    title={isFeatured ? "Retirer des populaires" : "Marquer comme populaire"}
                                  >
                                    <Star size={14} className={isFeatured ? 'fill-yellow-500' : ''} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleOngoing?.(media.id, !isOngoing)}
                                    className={`h-8 w-8 p-0 ${
                                      isOngoing 
                                        ? 'text-cyan-500 hover:text-cyan-400 bg-cyan-500/10' 
                                        : 'text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10'
                                    }`}
                                    title={isOngoing ? "Marquer comme terminé" : "Marquer comme en cours"}
                                  >
                                    <Clock size={14} className={isOngoing ? '' : ''} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedLibrary.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              Aucun contenu trouvé
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-t border-border/30 bg-muted/30 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {filteredLibrary.length} contenu{filteredLibrary.length > 1 ? 's' : ''} • Page {currentPage}/{totalPages || 1}
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Update Tab */}
            {activeTab === 'update' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">Mise à jour de l'affichage</h2>
                  <p className="text-muted-foreground text-sm">
                    Réorganise automatiquement les contenus pour mettre en avant les plus populaires dans chaque catégorie et génère de nouveaux slides hero.
                  </p>
                </div>

                <div className="bg-card/50 rounded-2xl border border-border/50 p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <RefreshCw size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">Rafraîchir la disposition</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Met à jour l'ordre des contenus dans chaque catégorie selon leur popularité. Les hero slides seront également régénérés avec les contenus les plus populaires de l'année dernière.
                      </p>
                      <Button
                        onClick={async () => {
                          setIsRefreshingLayout(true);
                          try {
                            // Delete all hero items from database to force auto-regeneration
                            const { error } = await supabase
                              .from('hero_items')
                              .delete()
                              .neq('id', '00000000-0000-0000-0000-000000000000');
                            
                            if (error) {
                              console.error('Error clearing hero items:', error);
                              toast.error('Erreur lors de la suppression des slides hero');
                              setIsRefreshingLayout(false);
                              return;
                            }
                            
                            // Dispatch event to trigger refresh in Index
                            window.dispatchEvent(new Event('gctv-force-hero-rotation'));
                            
                            toast.success('Hero slides régénérés ! Les images horizontales (backdrop) seront utilisées.');
                            
                            // Wait a moment then reload to apply changes
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          } catch (err) {
                            console.error('Error:', err);
                            toast.error('Une erreur est survenue');
                            setIsRefreshingLayout(false);
                          }
                        }}
                        disabled={isRefreshingLayout}
                        className="gap-2"
                      >
                        {isRefreshingLayout ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Mise à jour en cours...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} />
                            Forcer rotation des slides
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-6">
                    <h4 className="font-medium text-foreground mb-3">Ce qui sera mis à jour :</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-400" />
                        Films populaires - triés par note et popularité récente
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-400" />
                        Séries populaires - triés par note et popularité récente
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-400" />
                        Hero slides - régénérés avec images horizontales (backdrop)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-400" />
                        Catégories de niche - Kdramas, Animes, Bollywood triés par popularité
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-card/50 rounded-2xl border border-border/50 p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Megaphone size={24} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">Créer une notification</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Envoie une notification à tous les utilisateurs (visible dans la cloche).
                      </p>
                      <NotificationManager />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note :</strong> Cette action ne supprime aucun contenu. Elle réorganise uniquement l'ordre d'affichage pour mettre en valeur les contenus les plus populaires.
                  </p>
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
