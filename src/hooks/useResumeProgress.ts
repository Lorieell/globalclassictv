import { useMemo } from 'react';
import type { Media, Season } from '@/types/media';

interface WatchPosition {
  seasonId?: string;
  episodeId?: string;
}

interface ResumeInfo {
  progress: number;
  hasNewEpisodes: boolean;
  hasNewSeason: boolean;
  isCompleted: boolean;
  nextSeasonId?: string;
  nextEpisodeId?: string;
  label: string;
}

/**
 * Calculate the total number of episodes in a media
 */
const getTotalEpisodes = (media: Media): number => {
  if (!media.seasons || media.seasons.length === 0) return 0;
  return media.seasons.reduce((total, season) => total + season.episodes.length, 0);
};

/**
 * Get a flat list of all episode IDs for a media
 */
const getAllEpisodeIds = (media: Media): { seasonId: string; episodeId: string }[] => {
  if (!media.seasons) return [];
  const episodes: { seasonId: string; episodeId: string }[] = [];
  media.seasons.forEach(season => {
    season.episodes.forEach(episode => {
      episodes.push({ seasonId: season.id, episodeId: episode.id });
    });
  });
  return episodes;
};

/**
 * Get the index of an episode in the flat list
 */
const getEpisodeIndex = (
  media: Media, 
  seasonId?: string, 
  episodeId?: string
): number => {
  if (!seasonId || !episodeId || !media.seasons) return -1;
  const allEpisodes = getAllEpisodeIds(media);
  return allEpisodes.findIndex(ep => ep.seasonId === seasonId && ep.episodeId === episodeId);
};

/**
 * Calculate resume progress for a series, taking into account new episodes
 */
export const calculateSeriesProgress = (
  media: Media,
  watchedProgress: number,
  watchPosition?: WatchPosition,
  lastMediaUpdateTime?: number
): ResumeInfo => {
  const totalEpisodes = getTotalEpisodes(media);
  
  // If it's not a series or has no episodes
  if (totalEpisodes === 0) {
    return {
      progress: watchedProgress,
      hasNewEpisodes: false,
      hasNewSeason: false,
      isCompleted: watchedProgress === 100,
      label: watchedProgress === 100 ? 'Terminé' : `${watchedProgress}%`
    };
  }

  // Get the current watched position
  const currentIndex = getEpisodeIndex(media, watchPosition?.seasonId, watchPosition?.episodeId);
  const allEpisodes = getAllEpisodeIds(media);
  
  // Calculate how many episodes the user has watched
  // If progress is 100 and we have a position, user finished that episode
  const watchedEpisodes = currentIndex >= 0 ? currentIndex + 1 : 0;
  
  // Recalculate actual progress based on total episodes
  const actualProgress = totalEpisodes > 0 
    ? Math.round((watchedEpisodes / totalEpisodes) * 100)
    : watchedProgress;

  // If the stored progress was 100 but now it's less, new content was added
  const wasCompleted = watchedProgress === 100;
  const isNowCompleted = actualProgress === 100 || watchedEpisodes >= totalEpisodes;
  
  // Detect new episodes: user was at 100% but now there's more content
  const hasNewContent = wasCompleted && !isNowCompleted && currentIndex >= 0;
  
  // Determine if it's a new season or just new episodes
  let hasNewSeason = false;
  let hasNewEpisodes = false;
  
  if (hasNewContent && watchPosition?.seasonId) {
    const currentSeasonIndex = media.seasons?.findIndex(s => s.id === watchPosition.seasonId) ?? -1;
    const totalSeasons = media.seasons?.length ?? 0;
    
    // If there are more seasons after the current one, it's a new season
    hasNewSeason = currentSeasonIndex >= 0 && currentSeasonIndex < totalSeasons - 1;
    hasNewEpisodes = !hasNewSeason;
  }
  
  // Find the next unwatched episode
  let nextSeasonId: string | undefined;
  let nextEpisodeId: string | undefined;
  
  if (hasNewContent && currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
    const nextEp = allEpisodes[currentIndex + 1];
    nextSeasonId = nextEp.seasonId;
    nextEpisodeId = nextEp.episodeId;
  } else if (hasNewSeason && watchPosition?.seasonId) {
    // Jump to the first episode of the next season
    const currentSeasonIndex = media.seasons?.findIndex(s => s.id === watchPosition.seasonId) ?? -1;
    if (currentSeasonIndex >= 0 && media.seasons && media.seasons[currentSeasonIndex + 1]) {
      const nextSeason = media.seasons[currentSeasonIndex + 1];
      nextSeasonId = nextSeason.id;
      nextEpisodeId = nextSeason.episodes[0]?.id;
    }
  }
  
  // Generate label
  let label = `${actualProgress}%`;
  if (isNowCompleted) {
    label = 'Terminé';
  } else if (hasNewSeason) {
    label = `${actualProgress}% • NEW SEASON`;
  } else if (hasNewEpisodes) {
    label = `${actualProgress}% • NEW EP`;
  }
  
  return {
    progress: actualProgress,
    hasNewEpisodes,
    hasNewSeason,
    isCompleted: isNowCompleted,
    nextSeasonId,
    nextEpisodeId,
    label
  };
};

/**
 * Hook to get enhanced resume list with new episode detection
 */
export const useEnhancedResumeList = (
  library: Media[],
  watchProgress: Record<string, number>,
  watchPosition: Record<string, WatchPosition>
) => {
  return useMemo(() => {
    return library
      .filter(m => watchProgress[m.id] && watchProgress[m.id] > 0)
      .map(m => {
        const isSeries = m.type === 'Série' || m.type === 'Animé' || m.type === 'Émission';
        
        const resumeInfo = isSeries 
          ? calculateSeriesProgress(m, watchProgress[m.id], watchPosition[m.id], m.updatedAt)
          : {
              progress: watchProgress[m.id],
              hasNewEpisodes: false,
              hasNewSeason: false,
              isCompleted: watchProgress[m.id] === 100,
              label: watchProgress[m.id] === 100 ? 'Terminé' : `${watchProgress[m.id]}%`
            };
        
        return {
          ...m,
          progress: resumeInfo.progress,
          hasNewEpisodes: resumeInfo.hasNewEpisodes,
          hasNewSeason: resumeInfo.hasNewSeason,
          isCompleted: resumeInfo.isCompleted,
          nextSeasonId: resumeInfo.nextSeasonId,
          nextEpisodeId: resumeInfo.nextEpisodeId,
          progressLabel: resumeInfo.label
        };
      })
      .sort((a, b) => {
        // Priority: new content first, then in progress, then completed
        if (a.hasNewSeason !== b.hasNewSeason) return a.hasNewSeason ? -1 : 1;
        if (a.hasNewEpisodes !== b.hasNewEpisodes) return a.hasNewEpisodes ? -1 : 1;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return b.progress - a.progress;
      });
  }, [library, watchProgress, watchPosition]);
};

export type EnhancedResumeMedia = Media & {
  progress: number;
  hasNewEpisodes: boolean;
  hasNewSeason: boolean;
  isCompleted: boolean;
  nextSeasonId?: string;
  nextEpisodeId?: string;
  progressLabel: string;
};
