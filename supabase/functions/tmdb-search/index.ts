import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || '';
if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY not configured');
}
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Language mapping
const LANGUAGE_MAP: Record<string, string> = {
  'fr': 'VF',
  'en': 'VOSTFR',
  'es': 'VOSTFR',
  'de': 'VOSTFR',
  'it': 'VOSTFR',
  'pt': 'VOSTFR',
  'ja': 'VOSTFR',
  'ko': 'VOSTFR',
  'zh': 'VOSTFR',
  'hi': 'VOSTFR',
  'ar': 'VOSTFR',
  'ru': 'VOSTFR',
};

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  original_language: string;
  genre_ids: number[];
  media_type?: string;
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  genres: { id: number; name: string }[];
  release_date: string;
  vote_average: number;
  original_language: string;
  spoken_languages?: { iso_639_1: string; name: string }[];
  imdb_id?: string;
}

interface TMDBSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  genres: { id: number; name: string }[];
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  original_language: string;
  spoken_languages?: { iso_639_1: string; name: string }[];
  external_ids?: { imdb_id?: string };
}

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  console.log(`Fetching TMDB: ${url.toString()}`);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status} ${response.statusText}`);
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

function getLanguageLabel(lang: string, spokenLanguages?: { iso_639_1: string }[]): string {
  // Check if French is in spoken languages
  const hasFrench = spokenLanguages?.some(l => l.iso_639_1 === 'fr');
  if (hasFrench || lang === 'fr') {
    return 'VF';
  }
  return LANGUAGE_MAP[lang] || 'VOSTFR';
}

function getQualityLabel(rating: number, year: string): string {
  const releaseYear = parseInt(year) || 0;
  
  if (releaseYear >= 2020 && rating >= 7) {
    return '4K';
  }
  if (releaseYear >= 2015 && rating >= 6.5) {
    return 'Full HD';
  }
  return 'HD';
}

async function searchMulti(query: string): Promise<TMDBSearchResult[]> {
  try {
    const response = await fetchFromTMDB('/search/multi', { query });
    // Filter only movies and TV shows
    return (response.results || []).filter((r: TMDBSearchResult) => 
      r.media_type === 'movie' || r.media_type === 'tv'
    );
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return [];
  }
}

async function getMovieDetails(id: number): Promise<TMDBMovieDetails | null> {
  try {
    return await fetchFromTMDB(`/movie/${id}`);
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
}

async function getSeriesDetails(id: number): Promise<TMDBSeriesDetails | null> {
  try {
    const [details, externalIds] = await Promise.all([
      fetchFromTMDB(`/tv/${id}`),
      fetchFromTMDB(`/tv/${id}/external_ids`).catch(() => null)
    ]);
    if (externalIds) {
      details.external_ids = externalIds;
    }
    return details;
  } catch (error) {
    console.error(`Error fetching series ${id}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, tmdbId, mediaType } = await req.json();
    
    // If tmdbId is provided, fetch full details for that specific item
    if (tmdbId && mediaType) {
      console.log(`Fetching details for ${mediaType} ID: ${tmdbId}`);
      
      let result = null;
      
      if (mediaType === 'movie') {
        const details = await getMovieDetails(tmdbId);
        if (details) {
          const year = details.release_date?.split('-')[0] || '';
          result = {
            tmdbId: details.id,
            title: details.title,
            image: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : '',
            type: 'Film' as const,
            description: details.overview?.slice(0, 200) || '',
            synopsis: details.overview || '',
            genres: details.genres.map(g => g.name).join(', '),
            quality: getQualityLabel(details.vote_average, year),
            language: getLanguageLabel(details.original_language, details.spoken_languages),
            imdbId: details.imdb_id || '',
            year,
          };
        }
      } else if (mediaType === 'tv') {
        const details = await getSeriesDetails(tmdbId);
        if (details) {
          const year = details.first_air_date?.split('-')[0] || '';
          result = {
            tmdbId: details.id,
            title: details.name,
            image: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : '',
            type: 'Série' as const,
            description: details.overview?.slice(0, 200) || '',
            synopsis: details.overview || '',
            genres: details.genres.map(g => g.name).join(', '),
            quality: getQualityLabel(details.vote_average, year),
            language: getLanguageLabel(details.original_language, details.spoken_languages),
            imdbId: details.external_ids?.imdb_id || '',
            year,
            numberOfSeasons: details.number_of_seasons,
          };
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Otherwise, search for content
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Searching TMDB for: ${query}`);
    
    const searchResults = await searchMulti(query);
    
    // Transform results to simple format for dropdown
    const results = searchResults.slice(0, 10).map((item) => {
      const isMovie = item.media_type === 'movie';
      const title = isMovie ? item.title : item.name;
      const year = isMovie 
        ? item.release_date?.split('-')[0] 
        : item.first_air_date?.split('-')[0];
      
      return {
        tmdbId: item.id,
        title: title || 'Sans titre',
        year: year || '',
        type: isMovie ? 'Film' : 'Série',
        mediaType: item.media_type,
        image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
      };
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('TMDB search error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});