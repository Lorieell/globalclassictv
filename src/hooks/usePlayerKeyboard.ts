import { useEffect, useCallback } from 'react';
import type { PlayerState } from './usePlayerState';

interface UsePlayerKeyboardOptions {
  playerState: PlayerState;
  onToggleFullscreen?: () => void;
  onToggleMiniPlayer?: () => void;
  enabled?: boolean;
}

export function usePlayerKeyboard({
  playerState,
  onToggleFullscreen,
  onToggleMiniPlayer,
  enabled = true,
}: UsePlayerKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    
    const { key, shiftKey } = e;
    
    switch (key.toLowerCase()) {
      // Episode navigation (series only)
      case 'n':
        if (playerState.isSerie && playerState.canGoNext) {
          e.preventDefault();
          playerState.goToNextEpisode();
        }
        break;
      case 'p':
        if (playerState.isSerie && playerState.canGoPrev) {
          e.preventDefault();
          playerState.goToPrevEpisode();
        }
        break;
      
      // Shift+N = Next season
      case 'n':
        if (shiftKey && playerState.isSerie) {
          e.preventDefault();
          playerState.goToNextSeason();
        }
        break;
      
      // Toggle autoplay
      case 'a':
        e.preventDefault();
        playerState.toggleAutoplay();
        break;
      
      // Toggle display mode (cinema/default)
      case 't':
        e.preventDefault();
        playerState.toggleDisplayMode();
        break;
      
      // Fullscreen
      case 'f':
        if (onToggleFullscreen) {
          e.preventDefault();
          onToggleFullscreen();
        }
        break;
      
      // Mini player
      case 'i':
        if (onToggleMiniPlayer) {
          e.preventDefault();
          onToggleMiniPlayer();
        }
        break;
      
      // Escape = exit cinema/fullscreen
      case 'escape':
        if (playerState.displayMode === 'cinema') {
          e.preventDefault();
          playerState.setDisplayMode('default');
        }
        break;
    }
  }, [playerState, onToggleFullscreen, onToggleMiniPlayer]);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Keyboard shortcuts reference
export const KEYBOARD_SHORTCUTS = [
  { key: 'N', description: 'Épisode suivant' },
  { key: 'P', description: 'Épisode précédent' },
  { key: 'Shift+N', description: 'Saison suivante' },
  { key: 'A', description: 'Lecture automatique' },
  { key: 'T', description: 'Mode cinéma' },
  { key: 'F', description: 'Plein écran' },
  { key: 'I', description: 'Mini lecteur' },
  { key: 'Esc', description: 'Quitter mode cinéma' },
];
