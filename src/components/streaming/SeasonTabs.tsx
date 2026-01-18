import { cn } from '@/lib/utils';
import type { Season } from '@/types/media';

interface SeasonTabsProps {
  seasons: Season[];
  currentSeason: Season | null;
  onSelectSeason: (season: Season) => void;
  className?: string;
}

export default function SeasonTabs({
  seasons,
  currentSeason,
  onSelectSeason,
  className,
}: SeasonTabsProps) {
  if (seasons.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {seasons.map((season) => {
        const isActive = currentSeason?.id === season.id;
        const episodeCount = season.episodes?.length || 0;
        
        return (
          <button
            key={season.id}
            onClick={() => onSelectSeason(season)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-secondary border border-border"
            )}
          >
            <span>Saison {season.number}</span>
            <span 
              className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                isActive 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {episodeCount} ép.
            </span>
          </button>
        );
      })}
    </div>
  );
}
