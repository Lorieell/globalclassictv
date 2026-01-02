import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TMDB API configuration - read-only public key
const TMDB_API_KEY = 'ac50a108046652cc08e96dc5bf2abb8a';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  release_date: string;
  vote_average: number;
}

interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  first_air_date: string;
  vote_average: number;
}

const MOVIE_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Aventure',
  16: 'Animation',
  35: 'Comédie',
  80: 'Crime',
  99: 'Documentaire',
  18: 'Drame',
  10751: 'Famille',
  14: 'Fantastique',
  36: 'Histoire',
  27: 'Horreur',
  10402: 'Musique',
  9648: 'Mystère',
  10749: 'Romance',
  878: 'Science-Fiction',
  10770: 'Téléfilm',
  53: 'Thriller',
  10752: 'Guerre',
  37: 'Western',
};

const TV_GENRES: Record<number, string> = {
  10759: 'Action & Aventure',
  16: 'Animation',
  35: 'Comédie',
  80: 'Crime',
  99: 'Documentaire',
  18: 'Drame',
  10751: 'Famille',
  10762: 'Enfants',
  9648: 'Mystère',
  10763: 'News',
  10764: 'Réalité',
  10765: 'Sci-Fi & Fantastique',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'Guerre & Politique',
  37: 'Western',
};

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  console.log(`Fetching: ${url.toString()}`);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status} ${response.statusText}`);
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

async function checkFrenchAvailability(id: number, type: 'movie' | 'tv'): Promise<{ vf: boolean; vostfr: boolean }> {
  try {
    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const details = await fetchFromTMDB(endpoint, { append_to_response: 'translations' });
    
    const translations = details.translations?.translations || [];
    const hasFrench = translations.some((t: any) => 
      t.iso_639_1 === 'fr' && (t.data?.title || t.data?.name)
    );
    
    // If it has French translation or is a French production, consider it VF/VOSTFR available
    const isVF = hasFrench || details.original_language === 'fr';
    const isVOSTFR = hasFrench && details.original_language !== 'fr';
    
    return { vf: isVF, vostfr: isVOSTFR };
  } catch (error) {
    console.error(`Error checking French availability for ${type} ${id}:`, error);
    return { vf: false, vostfr: true }; // Default to VOSTFR if we can't check
  }
}

function transformMovie(movie: TMDBMovie, language: string): any {
  const genres = movie.genre_ids
    .map(id => MOVIE_GENRES[id])
    .filter(Boolean)
    .join(', ');
  
  return {
    id: `tmdb-movie-${movie.id}`,
    title: movie.title,
    image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '',
    type: 'Film',
    description: movie.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: movie.overview || 'Aucune description disponible.',
    genres,
    quality: 'HD',
    language,
    rating: movie.vote_average,
    year: movie.release_date?.split('-')[0] || '',
    backdrop: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : '',
    tmdbId: movie.id,
    videoUrls: '', // Placeholder - needs actual video source
  };
}

function transformSeries(series: TMDBSeries, language: string): any {
  const genres = series.genre_ids
    .map(id => TV_GENRES[id] || MOVIE_GENRES[id])
    .filter(Boolean)
    .join(', ');
  
  return {
    id: `tmdb-tv-${series.id}`,
    title: series.name,
    image: series.poster_path ? `${TMDB_IMAGE_BASE}${series.poster_path}` : '',
    type: 'Série',
    description: series.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: series.overview || 'Aucune description disponible.',
    genres,
    quality: 'HD',
    language,
    rating: series.vote_average,
    year: series.first_air_date?.split('-')[0] || '',
    backdrop: series.backdrop_path ? `${TMDB_BACKDROP_BASE}${series.backdrop_path}` : '',
    tmdbId: series.id,
    seasons: [], // Would need to fetch seasons details
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'all', category = 'popular', page = 1 } = await req.json().catch(() => ({}));
    
    console.log(`Importing TMDB content: type=${type}, category=${category}, page=${page}`);
    
    const results: any[] = [];
    
    // Fetch popular/trending movies
    if (type === 'all' || type === 'movies') {
      console.log('Fetching movies...');
      
      // Popular movies
      const popularMovies = await fetchFromTMDB('/movie/popular', { page: String(page) });
      // Top rated movies
      const topRatedMovies = await fetchFromTMDB('/movie/top_rated', { page: String(page) });
      // Now playing
      const nowPlayingMovies = await fetchFromTMDB('/movie/now_playing', { page: String(page) });
      
      const allMovies = [
        ...popularMovies.results.slice(0, 10),
        ...topRatedMovies.results.slice(0, 10),
        ...nowPlayingMovies.results.slice(0, 10),
      ];
      
      // Remove duplicates
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );
      
      for (const movie of uniqueMovies) {
        if (!movie.poster_path) continue;
        
        const { vf, vostfr } = await checkFrenchAvailability(movie.id, 'movie');
        const language = vf ? 'VF' : 'VOSTFR';
        
        results.push(transformMovie(movie, language));
      }
      
      console.log(`Fetched ${results.length} movies`);
    }
    
    // Fetch popular/trending series
    if (type === 'all' || type === 'series') {
      console.log('Fetching series...');
      
      // Popular series
      const popularSeries = await fetchFromTMDB('/tv/popular', { page: String(page) });
      // Top rated series
      const topRatedSeries = await fetchFromTMDB('/tv/top_rated', { page: String(page) });
      // On the air
      const onAirSeries = await fetchFromTMDB('/tv/on_the_air', { page: String(page) });
      
      const allSeries = [
        ...popularSeries.results.slice(0, 10),
        ...topRatedSeries.results.slice(0, 10),
        ...onAirSeries.results.slice(0, 10),
      ];
      
      // Remove duplicates
      const uniqueSeries = allSeries.filter((series, index, self) => 
        index === self.findIndex(s => s.id === series.id)
      );
      
      const seriesStartIndex = results.length;
      for (const series of uniqueSeries) {
        if (!series.poster_path) continue;
        
        const { vf, vostfr } = await checkFrenchAvailability(series.id, 'tv');
        const language = vf ? 'VF' : 'VOSTFR';
        
        results.push(transformSeries(series, language));
      }
      
      console.log(`Fetched ${results.length - seriesStartIndex} series`);
    }
    
    console.log(`Total content fetched: ${results.length} items`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: results,
      count: results.length,
      message: `${results.length} contenus importés depuis TMDB` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in tmdb-import function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
