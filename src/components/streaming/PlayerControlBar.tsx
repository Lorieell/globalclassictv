import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Maximize, 
  Minimize,
  Monitor,
  PictureInPicture2,
  ChevronDown,
  Check,
  Keyboard,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PlayerState, DisplayMode } from '@/hooks/usePlayerState';
import { KEYBOARD_SHORTCUTS } from '@/hooks/usePlayerKeyboard';
import { cn } from '@/lib/utils';

interface PlayerControlBarProps {
  playerState: PlayerState;
  onToggleFullscreen?: () => void;
  onToggleMiniPlayer?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export default function PlayerControlBar({
  playerState,
  onToggleFullscreen,
  onToggleMiniPlayer,
  isFullscreen = false,
  className,
}: PlayerControlBarProps) {
  const {
    isSerie,
    canGoPrev,
    canGoNext,
    goToPrevEpisode,
    goToNextEpisode,
    autoplayEnabled,
    toggleAutoplay,
    displayMode,
    toggleDisplayMode,
    videoUrls,
    sourceIndex,
    setSourceIndex,
  } = playerState;

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl",
          className
        )}
      >
        {/* Left section - Playback info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Volume2 size={14} className="shrink-0" />
            <span className="hidden sm:inline">Utilisez les contrôles du lecteur</span>
          </div>
        </div>

        {/* Center section - Main controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous Episode (series only) */}
          {isSerie && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevEpisode}
                  disabled={!canGoPrev}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                >
                  <SkipBack size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Épisode précédent (P)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Play/Pause placeholder - shows info since we can't control iframe */}
          <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 text-primary">
            <Play size={20} className="ml-0.5" />
          </div>

          {/* Next Episode (series only) */}
          {isSerie && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextEpisode}
                  disabled={!canGoNext}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                >
                  <SkipForward size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Épisode suivant (N)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right section - Secondary controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Autoplay toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoplay}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 p-0",
                  autoplayEnabled && "text-primary bg-primary/10"
                )}
              >
                <Repeat size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lecture auto {autoplayEnabled ? 'activée' : 'désactivée'} (A)</p>
            </TooltipContent>
          </Tooltip>

          {/* Display mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDisplayMode}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 p-0",
                  displayMode === 'cinema' && "text-primary bg-primary/10"
                )}
              >
                <Monitor size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{displayMode === 'cinema' ? 'Mode par défaut' : 'Mode cinéma'} (T)</p>
            </TooltipContent>
          </Tooltip>

          {/* Player selector */}
          {videoUrls.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 sm:h-9 gap-1 text-xs px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Lecteur</span> {sourceIndex + 1}
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuLabel className="text-xs">Changer de lecteur</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {videoUrls.map((_, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => setSourceIndex(i)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>Lecteur {i + 1}</span>
                    {sourceIndex === i && <Check size={14} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mini player */}
          {onToggleMiniPlayer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMiniPlayer}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex"
                >
                  <PictureInPicture2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mini lecteur (I)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? 'Quitter plein écran' : 'Plein écran'} (F)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Keyboard shortcuts info */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex"
              >
                <Keyboard size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border w-56">
              <DropdownMenuLabel>Raccourcis clavier</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {KEYBOARD_SHORTCUTS.filter(s => !s.key.includes('Shift') || isSerie).map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">{shortcut.description}</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
