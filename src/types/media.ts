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
  type: 'Film' | 'Série';
  description: string;
  synopsis?: string;
  genres?: string;
  quality?: string;
  language?: string;
  videoUrls?: string;
  seasons?: Season[];
  progress?: number;
  updatedAt?: number;
  director?: string;
  actors?: string;
  awards?: string;
  imdbId?: string;
}

export interface HeroItem {
  id: string;
  title: string;
  description: string;
  image: string;
  mediaId: string;
}
