import { Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Episode, Season } from '@/types/media';

interface EpisodeGridProps {
  season: Season;
  currentEpisode: Episode | null;
  onSelectEpisode: (episode: Episode) => void;
  compact?: boolean;
  className?: string;
}

export default function EpisodeGrid({
  season,
  currentEpisode,
  onSelectEpisode,
  compact = false,
  className,
}: EpisodeGridProps) {
  const episodes = season.episodes || [];

  if (episodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun épisode disponible
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {episodes.map((episode) => {
          const isActive = currentEpisode?.id === episode.id;
          return (
            <button
              key={episode.id}
              onClick={() => onSelectEpisode(episode)}
              className={cn(
                "flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-secondary border border-border"
              )}
            >
              {isActive ? <Play size={14} className="mr-1" /> : null}
              {episode.number}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", className)}>
      {episodes.map((episode) => {
        const isActive = currentEpisode?.id === episode.id;
        return (
          <button
            key={episode.id}
            onClick={() => onSelectEpisode(episode)}
            className={cn(
              "group relative flex items-start gap-3 p-3 rounded-xl text-left transition-all",
              isActive
                ? "bg-primary/10 border-2 border-primary"
                : "bg-card hover:bg-secondary border border-border hover:border-primary/50"
            )}
          >
            {/* Episode number badge */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 text-sm font-bold",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground group-hover:bg-primary/20"
              )}
            >
              {isActive ? <Play size={16} /> : episode.number}
            </div>

            {/* Episode info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Épisode {episode.number}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Check size={12} />
                    En lecture
                  </span>
                )}
              </div>
              <h4 className="font-medium truncate mt-0.5">
                {episode.title || `Épisode ${episode.number}`}
              </h4>
            </div>
          </button>
        );
      })}
    </div>
  );
}
