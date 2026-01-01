import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Save last position + compute progress (series = episode-based)
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;

    onPosition?.(media.id, selectedSeason.id, selectedEpisode.id);

    if (onProgress && flatEpisodes.length > 0 && currentFlatIndex >= 0) {
      const pct = Math.round(((currentFlatIndex + 1) / flatEpisodes.length) * 100);
      onProgress(media.id, pct);
    }
  }, [currentFlatIndex, flatEpisodes.length, isSerie, media.id, onPosition, onProgress, selectedEpisode, selectedSeason]);

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
      {/* Banner image header */}
      <div className="relative h-[120px] md:h-[180px] overflow-hidden">
        <img 
          src={media.image} 
          alt={media.title}
          className="w-full h-full object-cover object-top scale-110 blur-sm"
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
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase text-primary tracking-tight">
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

        {/* Controls row: Episode selector + Player selector */}
        <div className="flex flex-wrap gap-3 mb-4">
          {isSerie && selectedSeason && (
            <>
              {/* Episode selector */}
              <select
                value={selectedEpisode?.id || ''}
                onChange={(e) => {
                  const ep = selectedSeason.episodes?.find(ep => ep.id === e.target.value);
                  if (ep) {
                    setSelectedEpisode(ep);
                    setSourceIndex(0);
                  }
                }}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {selectedSeason.episodes?.map(ep => (
                  <option key={ep.id} value={ep.id}>Épisode {ep.number}</option>
                ))}
              </select>
            </>
          )}

          {/* Player selector */}
          {videoUrls.length > 0 && (
            <select
              value={sourceIndex}
              onChange={(e) => setSourceIndex(parseInt(e.target.value))}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {videoUrls.map((_, i) => (
                <option key={i} value={i}>Lecteur {i + 1}</option>
              ))}
            </select>
          )}
        </div>

        {/* Current selection info */}
        {isSerie && selectedEpisode && (
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
            Dernière sélection : <span className="text-foreground">Épisode {selectedEpisode.number} - {selectedEpisode.title}</span>
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
          Pub insistante ou vidéo indisponible ? <span className="text-foreground font-semibold">Changez de lecteur.</span>
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
