import { useState, useCallback, useEffect } from 'react';
import type { Media, Season, Episode } from '@/types/media';

export type DisplayMode = 'default' | 'cinema';

interface UsePlayerStateOptions {
  media: Media;
  initialSeasonId?: string;
  initialEpisodeId?: string;
  onProgress?: (mediaId: string, progress: number) => void;
  onPosition?: (mediaId: string, seasonId: string, episodeId: string) => void;
}

export interface PlayerState {
  // Display
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDisplayMode: () => void;
  
  // Autoplay
  autoplayEnabled: boolean;
  setAutoplayEnabled: (enabled: boolean) => void;
  toggleAutoplay: () => void;
  
  // Season/Episode
  selectedSeason: Season | null;
  selectedEpisode: Episode | null;
  setSelectedSeason: (season: Season) => void;
  setSelectedEpisode: (episode: Episode) => void;
  
  // Source
  sourceIndex: number;
  setSourceIndex: (index: number) => void;
  videoUrls: string[];
  currentUrl: string;
  
  // Navigation
  canGoPrev: boolean;
  canGoNext: boolean;
  goToPrevEpisode: () => void;
  goToNextEpisode: () => void;
  goToLastEpisode: () => void;
  goToNextSeason: () => void;
  
  // Info
  isSerie: boolean;
  allEpisodes: Episode[];
  currentEpisodeIndex: number;
  flatEpisodes: Array<{ seasonId: string; episodeId: string }>;
  currentFlatIndex: number;
  totalEpisodes: number;
}

export function usePlayerState({
  media,
  initialSeasonId,
  initialEpisodeId,
  onProgress,
  onPosition,
}: UsePlayerStateOptions): PlayerState {
  const isSerie = media.type === 'Série' || media.type === 'Animé' || media.type === 'Émission';
  
  // Load saved preferences
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('player-display-mode');
    return (saved as DisplayMode) || 'default';
  });
  
  const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
    const saved = localStorage.getItem('player-autoplay');
    return saved !== 'false'; // Default to true
  });
  
  // Save preferences
  useEffect(() => {
    localStorage.setItem('player-display-mode', displayMode);
  }, [displayMode]);
  
  useEffect(() => {
    localStorage.setItem('player-autoplay', String(autoplayEnabled));
  }, [autoplayEnabled]);
  
  // Find initial season
  const getInitialSeason = useCallback(() => {
    if (!isSerie || !media.seasons?.length) return null;
    if (initialSeasonId) {
      return media.seasons.find(s => s.id === initialSeasonId) || media.seasons[0];
    }
    return media.seasons[0];
  }, [isSerie, media.seasons, initialSeasonId]);
  
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(getInitialSeason());
  
  // Find initial episode
  const getInitialEpisode = useCallback(() => {
    if (!selectedSeason?.episodes?.length) return null;
    if (initialEpisodeId) {
      return selectedSeason.episodes.find(e => e.id === initialEpisodeId) || selectedSeason.episodes[0];
    }
    return selectedSeason.episodes[0];
  }, [selectedSeason, initialEpisodeId]);
  
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(getInitialEpisode());
  const [sourceIndex, setSourceIndex] = useState(0);
  
  // Compute video URLs
  const currentEpisode = isSerie ? selectedEpisode : null;
  const videoUrls = ((currentEpisode?.videoUrls || media.videoUrls || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean));
  const currentUrl = videoUrls[sourceIndex] || '';
  
  // All episodes for current season
  const allEpisodes = selectedSeason?.episodes || [];
  const currentEpisodeIndex = allEpisodes.findIndex(e => e.id === selectedEpisode?.id);
  
  // Flat list of all episodes across all seasons
  const flatEpisodes = isSerie && media.seasons?.length
    ? media.seasons.flatMap((season) =>
        (season.episodes || []).map((ep) => ({ seasonId: season.id, episodeId: ep.id }))
      )
    : [];
  
  const currentFlatIndex = isSerie && selectedSeason && selectedEpisode
    ? flatEpisodes.findIndex(
        (x) => x.seasonId === selectedSeason.id && x.episodeId === selectedEpisode.id
      )
    : -1;
  
  const totalEpisodes = flatEpisodes.length;
  
  // Navigation
  const canGoPrev = currentEpisodeIndex > 0;
  const canGoNext = currentEpisodeIndex < allEpisodes.length - 1;
  
  const goToPrevEpisode = useCallback(() => {
    if (currentEpisodeIndex > 0) {
      setSelectedEpisode(allEpisodes[currentEpisodeIndex - 1]);
      setSourceIndex(0);
    }
  }, [currentEpisodeIndex, allEpisodes]);
  
  const goToNextEpisode = useCallback(() => {
    if (currentEpisodeIndex < allEpisodes.length - 1) {
      setSelectedEpisode(allEpisodes[currentEpisodeIndex + 1]);
      setSourceIndex(0);
    } else if (autoplayEnabled && media.seasons) {
      // Go to next season if available
      const currentSeasonIndex = media.seasons.findIndex(s => s.id === selectedSeason?.id);
      if (currentSeasonIndex < media.seasons.length - 1) {
        const nextSeason = media.seasons[currentSeasonIndex + 1];
        setSelectedSeason(nextSeason);
        if (nextSeason.episodes?.length) {
          setSelectedEpisode(nextSeason.episodes[0]);
        }
        setSourceIndex(0);
      }
    }
  }, [currentEpisodeIndex, allEpisodes, autoplayEnabled, media.seasons, selectedSeason]);
  
  const goToLastEpisode = useCallback(() => {
    if (allEpisodes.length > 0) {
      setSelectedEpisode(allEpisodes[allEpisodes.length - 1]);
      setSourceIndex(0);
    }
  }, [allEpisodes]);
  
  const goToNextSeason = useCallback(() => {
    if (!media.seasons) return;
    const currentSeasonIndex = media.seasons.findIndex(s => s.id === selectedSeason?.id);
    if (currentSeasonIndex < media.seasons.length - 1) {
      const nextSeason = media.seasons[currentSeasonIndex + 1];
      setSelectedSeason(nextSeason);
      if (nextSeason.episodes?.length) {
        setSelectedEpisode(nextSeason.episodes[0]);
      }
      setSourceIndex(0);
    }
  }, [media.seasons, selectedSeason]);
  
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'default' ? 'cinema' : 'default');
  }, []);
  
  const toggleAutoplay = useCallback(() => {
    setAutoplayEnabled(prev => !prev);
  }, []);
  
  // Save position when episode changes
  useEffect(() => {
    if (!isSerie || !selectedSeason || !selectedEpisode) return;
    
    onPosition?.(media.id, selectedSeason.id, selectedEpisode.id);
    
    if (onProgress && totalEpisodes > 0 && currentFlatIndex >= 0) {
      const pct = Math.round(((currentFlatIndex + 1) / totalEpisodes) * 100);
      onProgress(media.id, pct);
    }
  }, [currentFlatIndex, totalEpisodes, isSerie, media.id, onPosition, onProgress, selectedEpisode, selectedSeason]);
  
  // Update episode when season changes
  useEffect(() => {
    if (!selectedSeason?.episodes?.length) return;
    
    // Keep current episode if it exists in new season (shouldn't happen, but safe)
    const currentEpInNewSeason = selectedSeason.episodes.find(e => e.id === selectedEpisode?.id);
    if (!currentEpInNewSeason) {
      setSelectedEpisode(selectedSeason.episodes[0]);
      setSourceIndex(0);
    }
  }, [selectedSeason]);
  
  return {
    displayMode,
    setDisplayMode,
    toggleDisplayMode,
    autoplayEnabled,
    setAutoplayEnabled,
    toggleAutoplay,
    selectedSeason,
    selectedEpisode,
    setSelectedSeason,
    setSelectedEpisode,
    sourceIndex,
    setSourceIndex,
    videoUrls,
    currentUrl,
    canGoPrev,
    canGoNext,
    goToPrevEpisode,
    goToNextEpisode,
    goToLastEpisode,
    goToNextSeason,
    isSerie,
    allEpisodes,
    currentEpisodeIndex,
    flatEpisodes,
    currentFlatIndex,
    totalEpisodes,
  };
}
