export interface Episode {
  id: string;
  number: number;
  title: string;
  videoUrls: string;
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface Media {
  id: string;
  title: string;
  image: string;
  type: 'Film' | 'Série' | 'Animé' | 'Émission' | 'Documentaire';
  description: string;
  synopsis?: string;
  genres?: string;
  quality?: string;
  language?: string;
  videoUrls?: string;
  trailerUrl?: string; // Trailer URL for video preview
  seasons?: Season[];
  progress?: number;
  updatedAt?: number;
  createdAt?: number; // For "new" badge logic
  director?: string;
  actors?: string;
  awards?: string;
  imdbId?: string;
  tmdbId?: number;
  isManual?: boolean; // True if added manually by admin (protected from auto-updates)
  popularity?: number; // TMDB popularity score
}

export interface HeroItem {
  id: string;
  title: string;
  description: string;
  image: string;
  mediaId: string;
}
