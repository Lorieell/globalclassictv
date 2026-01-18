import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Media, Season, Episode } from '@/types/media';

interface VideoPlayerProps {
  media: Media;
  initialSeasonId?: string;
  initialEpisodeId?: string;
  onBack: () => void;
  onProgress?: (mediaId: string, progress: number) => void;
  onPosition?: (mediaId: string, seasonId: string, episodeId: string) => void;
}

const VideoPlayer = ({ media, initialSeasonId, initialEpisodeId, onBack, onProgress, onPosition }: VideoPlayerProps) => {
  const isSerie = media.type === 'Série';
  
  // Find initial season
  const getInitialSeason = () => {
    if (!isSerie || !media.seasons?.length) return null;
    if (initialSeasonId) {
      return media.seasons.find(s => s.id === initialSeasonId) || media.seasons[0];
    }
    return media.seasons[0];
  };

  const [selectedSeason, setSelectedSeason] = useState<Season | null>(getInitialSeason());
  
  // Find initial episode
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

  // Get all episodes for navigation
  const allEpisodes = selectedSeason?.episodes || [];
  const currentEpisodeIndex = allEpisodes.findIndex(e => e.id === selectedEpisode?.id);

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

  // Save position immediately when episode changes
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;

    // Save position immediately
    onPosition?.(media.id, selectedSeason.id, selectedEpisode.id);

    // Compute and save progress
    if (onProgress && flatEpisodes.length > 0 && currentFlatIndex >= 0) {
      const pct = Math.round(((currentFlatIndex + 1) / flatEpisodes.length) * 100);
      onProgress(media.id, pct);
    }
  }, [currentFlatIndex, flatEpisodes.length, isSerie, media.id, onPosition, onProgress, selectedEpisode, selectedSeason]);

  // Save progress on page unload (closing tab, navigating away)
  useEffect(() => {
    const saveOnUnload = () => {
      if (isSerie && selectedSeason && selectedEpisode) {
        // Use sendBeacon for reliable save on page close
        const data = JSON.stringify({
          session_id: localStorage.getItem('gctv-session-id'),
          media_id: media.id,
          season_id: selectedSeason.id,
          episode_id: selectedEpisode.id,
          progress: flatEpisodes.length > 0 && currentFlatIndex >= 0 
            ? Math.round(((currentFlatIndex + 1) / flatEpisodes.length) * 100)
            : 0,
        });
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/watch_progress?on_conflict=session_id,media_id`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', saveOnUnload);
    return () => window.removeEventListener('beforeunload', saveOnUnload);
  }, [isSerie, selectedSeason, selectedEpisode, media.id, flatEpisodes.length, currentFlatIndex]);

  // Update episode when season changes (keep initialEpisodeId on first mount)
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

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Banner image header - clickable for back */}
      <div 
        onClick={onBack}
        className="relative h-[120px] md:h-[180px] overflow-hidden cursor-pointer group"
      >
        <img 
          src={media.image} 
          alt={media.title}
          className="w-full h-full object-cover object-top scale-110 blur-sm group-hover:scale-115 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        {/* Title and type */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-2 text-muted-foreground hover:text-foreground gap-1 -ml-3 text-sm"
          >
            <ChevronLeft size={18} />
            Retour
          </Button>
          <h1 
            onClick={onBack}
            className="font-display text-3xl md:text-4xl font-black uppercase text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            {media.title}
          </h1>
          <p className="text-muted-foreground uppercase text-sm tracking-wide">
            {isSerie && selectedSeason ? `Saison ${selectedSeason.number}` : media.type}
          </p>
          
          {/* Quality/Language badges */}
          <div className="flex gap-2 mt-2">
            {media.quality && (
              <span className="px-3 py-1 bg-destructive/20 border border-destructive/50 rounded-md text-xs font-bold text-destructive">
                {media.quality}
              </span>
            )}
            {media.language && (
              <span className="px-3 py-1 bg-primary/20 border border-primary/50 rounded-md text-xs font-bold text-primary">
                {media.language}
              </span>
            )}
          </div>
        </div>

        {/* Controls row: Season + Episode selector + Player selector */}
        <div className="flex flex-wrap gap-3 mb-4">
          {isSerie && media.seasons && media.seasons.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
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
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary min-w-[140px] max-w-[200px] justify-between">
                  <span className="truncate">
                    Ep. {selectedEpisode?.number} - {selectedEpisode?.title?.slice(0, 12)}{(selectedEpisode?.title?.length || 0) > 12 ? '...' : ''}
                  </span>
                  <ChevronDown size={16} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-card border-border z-50 min-w-[140px] max-w-[200px] max-h-[300px] overflow-y-auto" 
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={false}
              >
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

          {/* Player selector */}
          {videoUrls.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
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

        {/* Current selection info */}
        {isSerie && selectedEpisode && (
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
            En lecture : <span className="text-foreground font-medium">Épisode {selectedEpisode.number} - {selectedEpisode.title}</span>
          </p>
        )}

        {/* Navigation bar */}
        {isSerie && allEpisodes.length > 1 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-center gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevEpisode}
              disabled={currentEpisodeIndex <= 0}
              className="gap-2 rounded-xl border-border"
            >
              <RotateCcw size={14} />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastEpisode}
              className="gap-2 rounded-xl border-border"
            >
              <RotateCcw size={14} />
              Dernier épisode
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={goToNextEpisode}
              disabled={currentEpisodeIndex >= allEpisodes.length - 1}
              className="gap-2 rounded-xl bg-primary text-primary-foreground"
            >
              Suivant
              <ChevronRight size={14} />
            </Button>
          </div>
        )}

        {/* Player change hint */}
        <p className="text-center text-xs text-muted-foreground mb-4">
          Pub insistante ou vidéo indisponible ? <span className="text-foreground font-semibold">Utilisez un bloqueur de publicité ou changez de lecteur.</span>
        </p>

        {/* Video Player */}
        <div className="aspect-video bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 mb-8">
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

        {/* Bottom navigation (duplicate for convenience) */}
        {isSerie && allEpisodes.length > 1 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-center gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevEpisode}
              disabled={currentEpisodeIndex <= 0}
              className="gap-2 rounded-xl border-border"
            >
              <RotateCcw size={14} />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastEpisode}
              className="gap-2 rounded-xl border-border"
            >
              <RotateCcw size={14} />
              Dernier épisode
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={goToNextEpisode}
              disabled={currentEpisodeIndex >= allEpisodes.length - 1}
              className="gap-2 rounded-xl bg-primary text-primary-foreground"
            >
              Suivant
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
