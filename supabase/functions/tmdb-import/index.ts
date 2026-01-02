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

interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  release_date: string;
  vote_average: number;
  runtime: number;
  original_language: string;
}

interface TMDBSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  original_language: string;
}

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

async function getMovieDetails(id: number): Promise<TMDBMovieDetails | null> {
  try {
    const details = await fetchFromTMDB(`/movie/${id}`);
    return details;
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
}

async function getSeriesDetails(id: number): Promise<TMDBSeriesDetails | null> {
  try {
    const details = await fetchFromTMDB(`/tv/${id}`);
    return details;
  } catch (error) {
    console.error(`Error fetching series ${id}:`, error);
    return null;
  }
}

function transformMovieDetails(movie: TMDBMovieDetails): any {
  const genres = movie.genres.map(g => g.name).join(', ');
  const isVF = movie.original_language === 'fr';
  
  return {
    id: `tmdb-movie-${movie.id}`,
    title: movie.title,
    image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '',
    type: 'Film',
    description: movie.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: movie.overview || 'Aucune description disponible.',
    genres: genres || 'Drame',
    quality: 'HD',
    language: isVF ? 'VF' : 'VOSTFR',
    rating: movie.vote_average,
    year: movie.release_date?.split('-')[0] || '',
    backdrop: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : '',
    tmdbId: movie.id,
    videoUrls: '',
  };
}

function transformSeriesDetails(series: TMDBSeriesDetails): any {
  const genres = series.genres.map(g => g.name).join(', ');
  const isVF = series.original_language === 'fr';
  
  return {
    id: `tmdb-tv-${series.id}`,
    title: series.name,
    image: series.poster_path ? `${TMDB_IMAGE_BASE}${series.poster_path}` : '',
    type: 'Série',
    description: series.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: series.overview || 'Aucune description disponible.',
    genres: genres || 'Drame',
    quality: 'HD',
    language: isVF ? 'VF' : 'VOSTFR',
    rating: series.vote_average,
    year: series.first_air_date?.split('-')[0] || '',
    backdrop: series.backdrop_path ? `${TMDB_BACKDROP_BASE}${series.backdrop_path}` : '',
    tmdbId: series.id,
    seasons: [],
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'all', pages = 3 } = await req.json().catch(() => ({}));
    
    console.log(`Importing TMDB content: type=${type}, pages=${pages}`);
    
    const results: any[] = [];
    const processedIds = new Set<number>();
    
    // Fetch movies from multiple pages and categories
    if (type === 'all' || type === 'movies') {
      console.log('Fetching movies...');
      
      const movieEndpoints = [
        '/movie/popular',
        '/movie/top_rated',
        '/movie/now_playing',
        '/movie/upcoming',
      ];
      
      for (const endpoint of movieEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            for (const movie of response.results) {
              if (processedIds.has(movie.id) || !movie.poster_path) continue;
              processedIds.add(movie.id);
              
              // Get full details for complete genres and synopsis
              const details = await getMovieDetails(movie.id);
              if (details && details.overview) {
                results.push(transformMovieDetails(details));
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      console.log(`Fetched ${results.length} movies with full details`);
    }
    
    // Fetch series from multiple pages and categories
    if (type === 'all' || type === 'series') {
      console.log('Fetching series...');
      
      const seriesEndpoints = [
        '/tv/popular',
        '/tv/top_rated',
        '/tv/on_the_air',
        '/tv/airing_today',
      ];
      
      const seriesStartCount = results.length;
      
      for (const endpoint of seriesEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            for (const series of response.results) {
              // Use negative offset to avoid ID collision with movies
              const uniqueId = series.id + 1000000;
              if (processedIds.has(uniqueId) || !series.poster_path) continue;
              processedIds.add(uniqueId);
              
              // Get full details for complete genres and synopsis
              const details = await getSeriesDetails(series.id);
              if (details && details.overview) {
                results.push(transformSeriesDetails(details));
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      console.log(`Fetched ${results.length - seriesStartCount} series with full details`);
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
