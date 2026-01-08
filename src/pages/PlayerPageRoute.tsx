import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, RotateCcw, ChevronDown, Check, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Header from '@/components/streaming/Header';
import Footer from '@/components/streaming/Footer';
import AdvancedAdLayout from '@/components/streaming/AdvancedAdLayout';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { useAdmin } from '@/hooks/useAdmin';
import { generateSlug, findMediaBySlug } from '@/pages/CataloguePage';
import type { Media, Season, Episode } from '@/types/media';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PlayerPageRoute = () => {
  const { slug, seasonNum, episodeNum } = useParams<{ slug: string; seasonNum?: string; episodeNum?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Support both URL patterns: /catalogue/slug/saison-1/episode-2 and ?season=X&episode=Y
  const initialSeasonNum = seasonNum ? parseInt(seasonNum) : null;
  const initialEpisodeNum = episodeNum ? parseInt(episodeNum) : null;
  const fallbackSeasonId = searchParams.get('season') || undefined;
  const fallbackEpisodeId = searchParams.get('episode') || undefined;
  
  const { library, loading, updateProgress, updatePosition } = useSupabaseMedia();
  const { isAdmin, logout } = useAdmin();

  const media = slug ? findMediaBySlug(library, slug) : undefined;

  // Find season/episode by number from URL
  const getInitialIds = () => {
    if (!media?.seasons) return { seasonId: fallbackSeasonId, episodeId: fallbackEpisodeId };
    
    if (initialSeasonNum) {
      const season = media.seasons.find(s => s.number === initialSeasonNum);
      if (season) {
        const seasonId = season.id;
        let episodeId = season.episodes?.[0]?.id;
        
        if (initialEpisodeNum) {
          const ep = season.episodes?.find(e => e.number === initialEpisodeNum);
          if (ep) episodeId = ep.id;
        }
        return { seasonId, episodeId };
      }
    }
    
    return { seasonId: fallbackSeasonId, episodeId: fallbackEpisodeId };
  };

  useEffect(() => {
    if (!loading && !media && slug) {
      navigate('/catalogue');
    }
  }, [loading, media, slug, navigate]);

  const handleSetView = (view: string) => {
    if (view === 'home') navigate('/');
  };

  const handleSelectMedia = (m: Media) => {
    navigate(`/catalogue/${generateSlug(m.title)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!media) {
    return null;
  }

  const { seasonId, episodeId } = getInitialIds();

  return (
    <div className="min-h-screen bg-background">
      <Header 
        view="player"
        setView={handleSetView as any}
        isAdmin={isAdmin}
        onAdminClick={() => {}}
        onLogout={logout}
        library={library}
        onSelectMedia={handleSelectMedia}
      />
      
      <AdvancedAdLayout showAds={true}>
        <VideoPlayerContent 
          media={media}
          slug={slug!}
          initialSeasonId={seasonId}
          initialEpisodeId={episodeId}
          onProgress={updateProgress}
          onPosition={updatePosition}
        />
      </AdvancedAdLayout>
      
      <Footer />
    </div>
  );
};

interface VideoPlayerContentProps {
  media: Media;
  slug: string;
  initialSeasonId?: string;
  initialEpisodeId?: string;
  onProgress?: (mediaId: string, progress: number) => void;
  onPosition?: (mediaId: string, seasonId: string, episodeId: string) => void;
}

const VideoPlayerContent = ({ 
  media, 
  slug,
  initialSeasonId, 
  initialEpisodeId, 
  onProgress, 
  onPosition 
}: VideoPlayerContentProps) => {
  const navigate = useNavigate();
  const isSerie = media.type === 'Série' || media.type === 'Animé' || media.type === 'Émission';
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  
  const getInitialSeason = () => {
    if (!isSerie || !media.seasons?.length) return null;
    if (initialSeasonId) {
      return media.seasons.find(s => s.id === initialSeasonId) || media.seasons[0];
    }
    return media.seasons[0];
  };

  const [selectedSeason, setSelectedSeason] = useState<Season | null>(getInitialSeason());
  
  const getInitialEpisode = () => {
    if (!selectedSeason?.episodes?.length) return null;
    if (initialEpisodeId) {
      return selectedSeason.episodes.find(e => e.id === initialEpisodeId) || selectedSeason.episodes[0];
    }
    return selectedSeason.episodes[0];
  };

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(getInitialEpisode());
  const [sourceIndex, setSourceIndex] = useState(0);

  const currentEpisode = isSerie ? selectedEpisode : null;
  const videoUrls = (currentEpisode?.videoUrls || media.videoUrls || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const currentUrl = videoUrls[sourceIndex] || '';

  const allEpisodes = selectedSeason?.episodes || [];
  const currentEpisodeIndex = allEpisodes.findIndex(e => e.id === selectedEpisode?.id);

  // Update URL when season/episode changes (SEO friendly)
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;
    
    const newPath = `/catalogue/${slug}/saison-${selectedSeason.number}/episode-${selectedEpisode.number}`;
    if (window.location.pathname !== newPath) {
      window.history.replaceState(null, '', newPath);
    }
  }, [selectedSeason, selectedEpisode, slug, isSerie]);

  const goToPrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      setSelectedEpisode(allEpisodes[currentEpisodeIndex - 1]);
      setSourceIndex(0);
    }
  };

  const goToNextEpisode = () => {
    if (currentEpisodeIndex < allEpisodes.length - 1) {
      setSelectedEpisode(allEpisodes[currentEpisodeIndex + 1]);
      setSourceIndex(0);
    }
  };

  const goToLastEpisode = () => {
    if (allEpisodes.length > 0) {
      setSelectedEpisode(allEpisodes[allEpisodes.length - 1]);
      setSourceIndex(0);
    }
  };

  const initialEpisodeAppliedRef = useRef(false);

  const flatEpisodes = useMemo(() => {
    if (!isSerie || !media.seasons?.length) return [] as Array<{ seasonId: string; episodeId: string }>;
    return media.seasons.flatMap((season) =>
      (season.episodes || []).map((ep) => ({ seasonId: season.id, episodeId: ep.id }))
    );
  }, [isSerie, media.seasons]);

  const currentFlatIndex = useMemo(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return -1;
    return flatEpisodes.findIndex(
      (x) => x.seasonId === selectedSeason.id && x.episodeId === selectedEpisode.id
    );
  }, [flatEpisodes, isSerie, selectedSeason, selectedEpisode]);

  // Save last position + compute progress
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;

    onPosition?.(media.id, selectedSeason.id, selectedEpisode.id);

    if (onProgress && flatEpisodes.length > 0 && currentFlatIndex >= 0) {
      const pct = Math.round(((currentFlatIndex + 1) / flatEpisodes.length) * 100);
      onProgress(media.id, pct);
    }
  }, [currentFlatIndex, flatEpisodes.length, isSerie, media.id, onPosition, onProgress, selectedEpisode, selectedSeason]);

  // Update episode when season changes
  useEffect(() => {
    if (!selectedSeason?.episodes?.length) return;

    if (!initialEpisodeAppliedRef.current && initialEpisodeId) {
      const ep = selectedSeason.episodes.find((e) => e.id === initialEpisodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSourceIndex(0);
        initialEpisodeAppliedRef.current = true;
        return;
      }
    }

    setSelectedEpisode(selectedSeason.episodes[0]);
    setSourceIndex(0);
  }, [initialEpisodeId, selectedSeason]);

  const handleBack = () => {
    navigate(`/catalogue/${slug}`);
  };

  // Report broken player
  const handleReport = async () => {
    if (!reportMessage.trim()) {
      toast.error('Veuillez décrire le problème');
      return;
    }
    
    setIsReporting(true);
    
    try {
      // Use edge function to send email
      const { error } = await supabase.functions.invoke('send-report', {
        body: {
          mediaTitle: media.title,
          mediaId: media.id,
          season: selectedSeason?.number,
          episode: selectedEpisode?.number,
          playerIndex: sourceIndex + 1,
          message: reportMessage,
          url: window.location.href,
        }
      });
      
      if (error) throw error;
      
      toast.success('Signalement envoyé. Merci pour votre aide !');
      setShowReportModal(false);
      setReportMessage('');
    } catch (err) {
      console.error('Report error:', err);
      toast.error('Erreur lors de l\'envoi. Réessayez plus tard.');
    } finally {
      setIsReporting(false);
    }
  };

  // Get backdrop image for banner
  const backdropImage = (media as any).backdrop || media.image;

  return (
    <main className="pt-20 min-h-screen animate-fade-in">
      {/* Breadcrumb */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/catalogue" className="hover:text-primary transition-colors">Catalogue</Link>
          <span>/</span>
          <Link to={`/catalogue/${slug}`} className="hover:text-primary transition-colors">{media.title}</Link>
          <span>/</span>
          <span className="text-foreground">Lecture</span>
        </nav>
      </div>

      {/* Banner - Use BACKDROP (horizontal) */}
      <div 
        onClick={handleBack}
        className="relative h-[100px] sm:h-[120px] md:h-[180px] overflow-hidden cursor-pointer group"
      >
        <img 
          src={backdropImage} 
          alt={media.title}
          className="w-full h-full object-cover object-center blur-sm group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        {/* Title */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-2 text-muted-foreground hover:text-foreground gap-1 -ml-3 text-sm"
          >
            <ChevronLeft size={18} />
            Retour
          </Button>
          <h1 
            onClick={handleBack}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            {media.title}
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wide">
            {isSerie && selectedSeason ? `Saison ${selectedSeason.number}` : media.type}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {media.quality && (
              <span className="px-2 sm:px-3 py-1 bg-destructive/20 border border-destructive/50 rounded-md text-[10px] sm:text-xs font-bold text-destructive">
                {media.quality}
              </span>
            )}
            {media.language && (
              <span className="px-2 sm:px-3 py-1 bg-primary/20 border border-primary/50 rounded-md text-[10px] sm:text-xs font-bold text-primary">
                {media.language}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          {isSerie && media.seasons && media.seasons.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary text-xs sm:text-sm">
                  Saison {selectedSeason?.number}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border z-50 max-h-[300px] overflow-y-auto">
                {media.seasons.map((season) => (
                  <DropdownMenuItem
                    key={season.id}
                    onClick={() => {
                      setSelectedSeason(season);
                      setSourceIndex(0);
                    }}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>Saison {season.number}</span>
                    {selectedSeason?.id === season.id && <Check size={16} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isSerie && selectedSeason && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary min-w-[100px] sm:min-w-[140px] max-w-[180px] sm:max-w-[200px] justify-between text-xs sm:text-sm">
                  <span className="truncate">
                    Ep. {selectedEpisode?.number}
                  </span>
                  <ChevronDown size={16} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border z-50 min-w-[140px] max-w-[200px] max-h-[300px] overflow-y-auto" align="start">
                {selectedSeason.episodes?.map(ep => (
                  <DropdownMenuItem
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep);
                      setSourceIndex(0);
                    }}
                    className={`flex items-center gap-2 cursor-pointer py-2 px-3 ${
                      selectedEpisode?.id === ep.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="bg-secondary text-foreground text-xs font-bold px-2 py-0.5 rounded shrink-0">
                      {ep.number}
                    </span>
                    <span className="truncate text-sm flex-1">{ep.title}</span>
                    {selectedEpisode?.id === ep.id && <Check size={14} className="text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {videoUrls.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary text-xs sm:text-sm">
                  Lecteur {sourceIndex + 1}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border z-50">
                {videoUrls.map((_, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => setSourceIndex(i)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>Lecteur {i + 1}</span>
                    {sourceIndex === i && <Check size={16} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isSerie && selectedEpisode && (
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
            En lecture : <span className="text-foreground font-medium">Épisode {selectedEpisode.number} - {selectedEpisode.title}</span>
          </p>
        )}

        {/* Navigation */}
        {isSerie && allEpisodes.length > 1 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-2 sm:p-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevEpisode}
              disabled={currentEpisodeIndex <= 0}
              className="gap-1 sm:gap-2 rounded-xl border-border text-xs"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastEpisode}
              className="gap-1 sm:gap-2 rounded-xl border-border text-xs"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Dernier</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={goToNextEpisode}
              disabled={currentEpisodeIndex >= allEpisodes.length - 1}
              className="gap-1 sm:gap-2 rounded-xl bg-primary text-primary-foreground text-xs"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}

        <p className="text-center text-[10px] sm:text-xs text-muted-foreground mb-4">
          Pub insistante ou vidéo indisponible ? <span className="text-foreground font-semibold">Changez de lecteur.</span>
        </p>

        {/* Video Player */}
        <div className="aspect-video bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-card border border-border/50 mb-4">
          {currentUrl ? (
            <iframe 
              src={currentUrl} 
              className="w-full h-full" 
              allowFullScreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Play size={64} className="opacity-30" />
              <p className="text-sm">Aucune source vidéo disponible</p>
            </div>
          )}
        </div>

        {/* Report Button */}
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10 text-xs sm:text-sm"
          >
            <AlertTriangle size={14} />
            Signaler un problème
          </Button>
        </div>

        {/* Bottom navigation */}
        {isSerie && allEpisodes.length > 1 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-2 sm:p-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevEpisode}
              disabled={currentEpisodeIndex <= 0}
              className="gap-1 sm:gap-2 rounded-xl border-border text-xs"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastEpisode}
              className="gap-1 sm:gap-2 rounded-xl border-border text-xs"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Dernier</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={goToNextEpisode}
              disabled={currentEpisodeIndex >= allEpisodes.length - 1}
              className="gap-1 sm:gap-2 rounded-xl bg-primary text-primary-foreground text-xs"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Signaler un problème
            </DialogTitle>
            <DialogDescription>
              Le lecteur ne fonctionne pas ? Décrivez le problème et nous le corrigerons rapidement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Média :</strong> {media.title}</p>
              {selectedSeason && <p><strong>Saison :</strong> {selectedSeason.number}</p>}
              {selectedEpisode && <p><strong>Épisode :</strong> {selectedEpisode.number}</p>}
              <p><strong>Lecteur :</strong> {sourceIndex + 1}</p>
            </div>
            
            <Textarea
              placeholder="Décrivez le problème (ex: vidéo ne charge pas, erreur 404, lien mort...)"
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              className="min-h-[100px]"
            />
            
            <Button
              onClick={handleReport}
              disabled={isReporting || !reportMessage.trim()}
              className="w-full gap-2"
            >
              {isReporting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Envoyer le signalement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PlayerPageRoute;