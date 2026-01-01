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
  videoUrls?: string;
  seasons?: Season[];
  progress?: number;
  updatedAt?: number;
}

export interface HeroItem {
  id: string;
  title: string;
  description: string;
  image: string;
  mediaId: string;
}
