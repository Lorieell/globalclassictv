import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Play, 
  AlertTriangle, 
  Send, 
  X,
  Minimize2,
  Star,
  Clock,
  Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import PlayerControlBar from '@/components/streaming/PlayerControlBar';
import SeasonTabs from '@/components/streaming/SeasonTabs';
import EpisodeGrid from '@/components/streaming/EpisodeGrid';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { useAdmin } from '@/hooks/useAdmin';
import { usePlayerState } from '@/hooks/usePlayerState';
import { usePlayerKeyboard } from '@/hooks/usePlayerKeyboard';
import { generateSlug, findMediaBySlug } from '@/pages/CataloguePage';
import type { Media } from '@/types/media';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const PlayerPageRoute = () => {
  const { slug, seasonNum, episodeNum } = useParams<{ slug: string; seasonNum?: string; episodeNum?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialSeasonNum = seasonNum ? parseInt(seasonNum) : null;
  const initialEpisodeNum = episodeNum ? parseInt(episodeNum) : null;
  const fallbackSeasonId = searchParams.get('season') || undefined;
  const fallbackEpisodeId = searchParams.get('episode') || undefined;
  
  const { library, loading, updateProgress, updatePosition } = useSupabaseMedia();
  const { isAdmin, logout } = useAdmin();

  const media = slug ? findMediaBySlug(library, slug) : undefined;

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
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Player state
  const playerState = usePlayerState({
    media,
    initialSeasonId,
    initialEpisodeId,
    onProgress,
    onPosition,
  });
  
  const {
    displayMode,
    isSerie,
    selectedSeason,
    selectedEpisode,
    setSelectedSeason,
    setSelectedEpisode,
    currentUrl,
    sourceIndex,
  } = playerState;
  
  // Fullscreen & Mini player
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  
  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  
  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);
  
  // Mini player toggle
  const toggleMiniPlayer = useCallback(() => {
    setIsMiniPlayer(prev => !prev);
  }, []);
  
  // Keyboard shortcuts
  usePlayerKeyboard({
    playerState,
    onToggleFullscreen: toggleFullscreen,
    onToggleMiniPlayer: toggleMiniPlayer,
    enabled: true,
  });
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Update URL when season/episode changes (SEO friendly)
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;
    
    const newPath = `/catalogue/${slug}/saison-${selectedSeason.number}/episode-${selectedEpisode.number}`;
    if (window.location.pathname !== newPath) {
      window.history.replaceState(null, '', newPath);
    }
  }, [selectedSeason, selectedEpisode, slug, isSerie]);
  
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
  
  const backdropImage = (media as any).backdrop || media.image;
  
  return (
    <>
      <main 
        className={cn(
          "pt-20 min-h-screen animate-fade-in transition-all duration-300",
          displayMode === 'cinema' && "pt-16 bg-black"
        )}
      >
        {/* Breadcrumb - hidden in cinema mode */}
        {displayMode !== 'cinema' && (
          <div className="px-4 md:px-8 max-w-7xl mx-auto">
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
        )}

        {/* Main player container */}
        <div 
          ref={playerContainerRef}
          className={cn(
            "transition-all duration-300",
            displayMode === 'cinema' 
              ? "max-w-full px-0" 
              : "max-w-7xl mx-auto px-4 md:px-8"
          )}
        >
          {/* Back button & Title - hidden in cinema mode */}
          {displayMode !== 'cinema' && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-2 text-muted-foreground hover:text-foreground gap-1 -ml-3 text-sm"
              >
                <ChevronLeft size={18} />
                Retour à la fiche
              </Button>
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 
                    onClick={handleBack}
                    className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {media.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
                    {isSerie && selectedSeason && (
                      <span>Saison {selectedSeason.number}</span>
                    )}
                    {isSerie && selectedEpisode && (
                      <>
                        <span>•</span>
                        <span>Épisode {selectedEpisode.number}</span>
                      </>
                    )}
                    {!isSerie && media.type && (
                      <span className="flex items-center gap-1">
                        <Film size={14} />
                        {media.type}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {media.quality && (
                    <span className="px-2 py-1 bg-destructive/20 border border-destructive/50 rounded-md text-xs font-bold text-destructive">
                      {media.quality}
                    </span>
                  )}
                  {media.language && (
                    <span className="px-2 py-1 bg-primary/20 border border-primary/50 rounded-md text-xs font-bold text-primary">
                      {media.language}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Episode title */}
              {isSerie && selectedEpisode && (
                <p className="text-foreground mt-2">
                  {selectedEpisode.title || `Épisode ${selectedEpisode.number}`}
                </p>
              )}
            </div>
          )}

          {/* Video Player */}
          <div 
            className={cn(
              "relative bg-black overflow-hidden transition-all duration-300",
              displayMode === 'cinema' 
                ? "aspect-video w-full" 
                : "aspect-video rounded-xl border border-border/30"
            )}
          >
            {currentUrl ? (
              <iframe 
                ref={iframeRef}
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
            
            {/* Cinema mode exit button */}
            {displayMode === 'cinema' && (
              <button 
                onClick={() => playerState.setDisplayMode('default')}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors z-10"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Control bar */}
          <div className={cn(
            "mt-3",
            displayMode === 'cinema' && "px-4"
          )}>
            <PlayerControlBar
              playerState={playerState}
              onToggleFullscreen={toggleFullscreen}
              onToggleMiniPlayer={toggleMiniPlayer}
              isFullscreen={isFullscreen}
            />
          </div>
          
          {/* Report button */}
          <div className={cn(
            "flex justify-center mt-4",
            displayMode === 'cinema' && "px-4"
          )}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportModal(true)}
              className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
            >
              <AlertTriangle size={14} />
              Signaler un problème
            </Button>
          </div>
        </div>

        {/* Content below player - hidden in cinema mode */}
        {displayMode !== 'cinema' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
            {/* Season/Episode selection for series */}
            {isSerie && media.seasons && media.seasons.length > 0 && (
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock size={18} />
                    Épisodes
                  </h3>
                  
                  {/* Season tabs */}
                  <SeasonTabs
                    seasons={media.seasons}
                    currentSeason={selectedSeason}
                    onSelectSeason={setSelectedSeason}
                    className="mb-4"
                  />
                  
                  {/* Episode grid */}
                  {selectedSeason && (
                    <EpisodeGrid
                      season={selectedSeason}
                      currentEpisode={selectedEpisode}
                      onSelectEpisode={setSelectedEpisode}
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Media info */}
            <div className="grid md:grid-cols-3 gap-6 pb-8">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {media.description || media.synopsis || "Aucune description disponible."}
                </p>
                
                {media.genres && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {media.genres.split(',').map((genre, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 bg-card border border-border rounded-full text-sm"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {media.director && (
                  <div>
                    <span className="text-muted-foreground text-sm">Réalisateur</span>
                    <p className="font-medium">{media.director}</p>
                  </div>
                )}
                {media.actors && (
                  <div>
                    <span className="text-muted-foreground text-sm">Acteurs</span>
                    <p className="font-medium">{media.actors}</p>
                  </div>
                )}
                {(media as any).year && (
                  <div>
                    <span className="text-muted-foreground text-sm">Année</span>
                    <p className="font-medium">{(media as any).year}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini player */}
      {isMiniPlayer && currentUrl && (
        <div className="fixed bottom-4 right-4 w-80 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border z-50 animate-scale-in">
          <iframe 
            src={currentUrl} 
            className="w-full h-full" 
            allowFullScreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          <button 
            onClick={toggleMiniPlayer}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-lg text-white transition-colors"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      )}

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
    </>
  );
};

export default PlayerPageRoute;
