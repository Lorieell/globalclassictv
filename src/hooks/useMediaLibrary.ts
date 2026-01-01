import { useState, useEffect, useMemo } from 'react';
import type { Media, HeroItem } from '@/types/media';

const STORAGE_KEY = 'gctv-library';
const HERO_STORAGE_KEY = 'gctv-hero';
const PROGRESS_KEY = 'gctv-progress';
const WATCHLIST_KEY = 'gctv-watchlist';
const POSITION_KEY = 'gctv-position';
// Demo data
const initialLibrary: Media[] = [
  {
    id: '1',
    title: 'Inception',
    image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg',
    type: 'Film',
    description: 'Un voleur qui s\'infiltre dans les rêves des gens pour voler leurs secrets.',
    synopsis: 'Dom Cobb est un voleur expérimenté dans l\'art de l\'extraction. Sa spécialité : s\'infiltrer dans les rêves pour y voler les secrets les plus précieux. Mais une dernière mission pourrait lui offrir la rédemption.',
    genres: 'Action, Science-Fiction, Thriller',
    quality: 'HD',
    language: 'VF',
    videoUrls: 'https://www.youtube.com/embed/YoHD9XEInc0',
  },
  {
    id: '2',
    title: 'Breaking Bad',
    image: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    type: 'Série',
    description: 'Un professeur de chimie devient un baron de la drogue.',
    synopsis: 'Walter White, un professeur de chimie, découvre qu\'il a un cancer. Pour assurer l\'avenir financier de sa famille, il décide de fabriquer de la méthamphétamine avec un ancien élève.',
    genres: 'Drame, Crime, Thriller',
    quality: 'FHD',
    language: 'VOSTFR',
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
    synopsis: 'Avec l\'aide du lieutenant de police Jim Gordon et du procureur de Gotham Harvey Dent, Batman entreprend de démanteler les organisations criminelles. Mais il se heurte bientôt au Joker.',
    genres: 'Action, Drame, Crime',
    quality: 'HD',
    language: 'VF',
    videoUrls: 'https://www.youtube.com/embed/EXeTwQWrcwY',
  },
  {
    id: '4',
    title: 'Stranger Things',
    image: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    type: 'Série',
    description: 'Une disparition mystérieuse dans une petite ville américaine.',
    synopsis: 'À Hawkins, une petite ville de l\'Indiana, le jeune Will Byers disparaît mystérieusement. Ses amis partent à sa recherche et découvrent une fillette aux pouvoirs surnaturels.',
    genres: 'Science-Fiction, Horreur, Drame',
    quality: 'FHD',
    language: 'VOSTFR',
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
    synopsis: 'La Terre se meurt, et l\'humanité doit trouver un nouveau foyer. Un groupe d\'astronautes traverse un trou de ver pour explorer des planètes potentiellement habitables dans une autre galaxie.',
    genres: 'Science-Fiction, Aventure, Drame',
    quality: 'HD',
    language: 'VF',
    videoUrls: 'https://www.youtube.com/embed/zSWdZVtXT7E',
  },
  {
    id: '6',
    title: 'Game of Thrones',
    image: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    type: 'Série',
    description: 'Neuf familles nobles luttent pour le contrôle des Sept Royaumes.',
    synopsis: 'Dans un monde médiéval fantastique, plusieurs familles nobles se disputent le Trône de Fer, tandis qu\'une menace ancestrale s\'éveille au-delà du Mur.',
    genres: 'Fantastique, Drame, Aventure',
    quality: 'FHD',
    language: 'VOSTFR',
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
  const [watchPosition, setWatchPosition] = useState<Record<string, { seasonId?: string; episodeId?: string }>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedHero = localStorage.getItem(HERO_STORAGE_KEY);
    const storedProgress = localStorage.getItem(PROGRESS_KEY);
    const storedPosition = localStorage.getItem(POSITION_KEY);
    const storedWatchlist = localStorage.getItem(WATCHLIST_KEY);
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

    if (storedPosition) {
      setWatchPosition(JSON.parse(storedPosition));
    }

    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
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
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    const newProgress = { ...watchProgress, [mediaId]: clamped };
    setWatchProgress(newProgress);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  };

  const updatePosition = (mediaId: string, seasonId?: string, episodeId?: string) => {
    const next = { ...watchPosition, [mediaId]: { seasonId, episodeId } };
    setWatchPosition(next);
    localStorage.setItem(POSITION_KEY, JSON.stringify(next));
  };

  const toggleWatchlist = (mediaId: string) => {
    const newWatchlist = watchlist.includes(mediaId)
      ? watchlist.filter(id => id !== mediaId)
      : [...watchlist, mediaId];
    setWatchlist(newWatchlist);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newWatchlist));
  };

  const isInWatchlist = (mediaId: string) => watchlist.includes(mediaId);

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

  const watchlistMedia = useMemo(() => {
    return library.filter(m => watchlist.includes(m.id));
  }, [library, watchlist]);

  return {
    library,
    films,
    series,
    heroItems,
    resumeList,
    watchProgress,
    watchPosition,
    watchlist,
    watchlistMedia,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    addHeroItem,
    updateHeroItem,
    deleteHeroItem,
    updateProgress,
    updatePosition,
    saveHeroItems,
    toggleWatchlist,
    isInWatchlist,
  };
};
