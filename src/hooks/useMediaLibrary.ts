import { useState, useEffect, useMemo } from 'react';
import type { Media, HeroItem } from '@/types/media';

const STORAGE_KEY = 'gctv-library';
const HERO_STORAGE_KEY = 'gctv-hero';
const PROGRESS_KEY = 'gctv-progress';

// Demo data
const initialLibrary: Media[] = [
  {
    id: '1',
    title: 'Inception',
    image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg',
    type: 'Film',
    description: 'Un voleur qui s\'infiltre dans les rêves des gens pour voler leurs secrets.',
    videoUrls: 'https://www.youtube.com/embed/YoHD9XEInc0',
  },
  {
    id: '2',
    title: 'Breaking Bad',
    image: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    type: 'Série',
    description: 'Un professeur de chimie devient un baron de la drogue.',
    seasons: [
      {
        id: 's1',
        number: 1,
        episodes: [
          { id: 'e1', number: 1, title: 'Pilot', videoUrls: 'https://www.youtube.com/embed/HhesaQXLuRY' },
          { id: 'e2', number: 2, title: 'Cat\'s in the Bag...', videoUrls: '' },
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'The Dark Knight',
    image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    type: 'Film',
    description: 'Batman doit affronter le Joker, un criminel psychopathe.',
    videoUrls: 'https://www.youtube.com/embed/EXeTwQWrcwY',
  },
  {
    id: '4',
    title: 'Stranger Things',
    image: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    type: 'Série',
    description: 'Une disparition mystérieuse dans une petite ville américaine.',
    seasons: [
      {
        id: 's1',
        number: 1,
        episodes: [
          { id: 'e1', number: 1, title: 'The Vanishing of Will Byers', videoUrls: '' },
        ]
      }
    ]
  },
  {
    id: '5',
    title: 'Interstellar',
    image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    type: 'Film',
    description: 'Des explorateurs voyagent à travers un trou de ver dans l\'espace.',
    videoUrls: 'https://www.youtube.com/embed/zSWdZVtXT7E',
  },
  {
    id: '6',
    title: 'Game of Thrones',
    image: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    type: 'Série',
    description: 'Neuf familles nobles luttent pour le contrôle des Sept Royaumes.',
    seasons: [
      {
        id: 's1',
        number: 1,
        episodes: [
          { id: 'e1', number: 1, title: 'Winter is Coming', videoUrls: '' },
        ]
      }
    ]
  },
];

const initialHeroItems: HeroItem[] = [
  {
    id: 'h1',
    title: 'INCEPTION',
    description: 'Plongez dans les profondeurs de l\'esprit humain. Un voleur de rêves vous attend.',
    image: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    mediaId: '1',
  },
  {
    id: 'h2',
    title: 'INTERSTELLAR',
    description: 'L\'humanité doit trouver un nouveau foyer. Au-delà des étoiles.',
    image: 'https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
    mediaId: '5',
  },
];

export const useMediaLibrary = () => {
  const [library, setLibrary] = useState<Media[]>([]);
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedHero = localStorage.getItem(HERO_STORAGE_KEY);
    const storedProgress = localStorage.getItem(PROGRESS_KEY);

    if (stored) {
      setLibrary(JSON.parse(stored));
    } else {
      setLibrary(initialLibrary);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLibrary));
    }

    if (storedHero) {
      setHeroItems(JSON.parse(storedHero));
    } else {
      setHeroItems(initialHeroItems);
      localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(initialHeroItems));
    }

    if (storedProgress) {
      setWatchProgress(JSON.parse(storedProgress));
    }

    setLoading(false);
  }, []);

  // Save to localStorage
  const saveLibrary = (newLibrary: Media[]) => {
    setLibrary(newLibrary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
  };

  const saveHeroItems = (newHero: HeroItem[]) => {
    setHeroItems(newHero);
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(newHero));
  };

  const updateProgress = (mediaId: string, progress: number) => {
    const newProgress = { ...watchProgress, [mediaId]: progress };
    setWatchProgress(newProgress);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  };

  const addMedia = (media: Omit<Media, 'id'>) => {
    const newMedia = { ...media, id: crypto.randomUUID(), updatedAt: Date.now() };
    saveLibrary([...library, newMedia]);
    return newMedia;
  };

  const updateMedia = (id: string, updates: Partial<Media>) => {
    saveLibrary(library.map(m => m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m));
  };

  const deleteMedia = (id: string) => {
    saveLibrary(library.filter(m => m.id !== id));
  };

  const addHeroItem = (hero: Omit<HeroItem, 'id'>) => {
    const newHero = { ...hero, id: crypto.randomUUID() };
    saveHeroItems([...heroItems, newHero]);
  };

  const updateHeroItem = (id: string, updates: Partial<HeroItem>) => {
    saveHeroItems(heroItems.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHeroItem = (id: string) => {
    saveHeroItems(heroItems.filter(h => h.id !== id));
  };

  const films = useMemo(() => library.filter(m => m.type === 'Film'), [library]);
  const series = useMemo(() => library.filter(m => m.type === 'Série'), [library]);
  
  const resumeList = useMemo(() => {
    return library
      .filter(m => watchProgress[m.id] && watchProgress[m.id] > 0 && watchProgress[m.id] < 100)
      .map(m => ({ ...m, progress: watchProgress[m.id] }));
  }, [library, watchProgress]);

  return {
    library,
    films,
    series,
    heroItems,
    resumeList,
    watchProgress,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    addHeroItem,
    updateHeroItem,
    deleteHeroItem,
    updateProgress,
    saveHeroItems,
  };
};
