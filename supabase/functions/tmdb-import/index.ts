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

// TMDB genre IDs for fetching by genre
const GENRE_IDS = {
  movies: {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    scifi: 878,
    thriller: 53,
    war: 10752,
    western: 37,
  },
  tv: {
    action: 10759,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    kids: 10762,
    mystery: 9648,
    news: 10763,
    reality: 10764,
    scifi: 10765,
    soap: 10766,
    talk: 10767,
    war: 10768,
    western: 37,
  }
};

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
  spoken_languages?: { iso_639_1: string; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
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
  spoken_languages?: { iso_639_1: string; name: string }[];
  origin_country?: string[];
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

function getLanguageLabel(movie: TMDBMovieDetails | TMDBSeriesDetails): string {
  const origLang = movie.original_language;
  
  // Check if French is in spoken languages
  const hasFrench = movie.spoken_languages?.some(l => l.iso_639_1 === 'fr');
  if (hasFrench || origLang === 'fr') {
    return 'VF';
  }
  
  // Return based on original language
  return LANGUAGE_MAP[origLang] || 'VOSTFR';
}

function getQualityLabel(rating: number, year: string): string {
  const currentYear = new Date().getFullYear();
  const releaseYear = parseInt(year) || 0;
  
  // Newer high-rated content gets 4K label
  if (releaseYear >= 2020 && rating >= 7) {
    return '4K';
  }
  if (releaseYear >= 2015 && rating >= 6.5) {
    return 'Full HD';
  }
  if (releaseYear >= 2010) {
    return 'HD';
  }
  return 'HD';
}

function transformMovieDetails(movie: TMDBMovieDetails): any {
  const genres = movie.genres.map(g => g.name).join(', ');
  const year = movie.release_date?.split('-')[0] || '';
  const language = getLanguageLabel(movie);
  const quality = getQualityLabel(movie.vote_average, year);
  
  return {
    id: `tmdb-movie-${movie.id}`,
    title: movie.title,
    image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '',
    type: 'Film',
    description: movie.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: movie.overview || 'Aucune description disponible.',
    genres: genres || 'Drame',
    quality,
    language,
    rating: movie.vote_average,
    year,
    backdrop: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : '',
    tmdbId: movie.id,
    videoUrls: '',
  };
}

function transformSeriesDetails(series: TMDBSeriesDetails): any {
  const genres = series.genres.map(g => g.name).join(', ');
  const year = series.first_air_date?.split('-')[0] || '';
  const language = getLanguageLabel(series);
  const quality = getQualityLabel(series.vote_average, year);
  
  return {
    id: `tmdb-tv-${series.id}`,
    title: series.name,
    image: series.poster_path ? `${TMDB_IMAGE_BASE}${series.poster_path}` : '',
    type: 'Série',
    description: series.overview?.slice(0, 200) || 'Aucune description disponible.',
    synopsis: series.overview || 'Aucune description disponible.',
    genres: genres || 'Drame',
    quality,
    language,
    rating: series.vote_average,
    year,
    backdrop: series.backdrop_path ? `${TMDB_BACKDROP_BASE}${series.backdrop_path}` : '',
    tmdbId: series.id,
    seasons: [],
  };
}

async function searchContent(query: string, type: 'movie' | 'tv'): Promise<any[]> {
  try {
    const response = await fetchFromTMDB(`/search/${type}`, { query });
    return response.results || [];
  } catch (error) {
    console.error(`Error searching ${type} for "${query}":`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'all', pages = 5, search = '' } = await req.json().catch(() => ({}));
    
    console.log(`Importing TMDB content: type=${type}, pages=${pages}, search=${search}`);
    
    const results: any[] = [];
    const processedIds = new Set<string>();
    
    // Handle search query
    if (search) {
      console.log(`Searching for: ${search}`);
      
      const movieResults = await searchContent(search, 'movie');
      for (const movie of movieResults.slice(0, 20)) {
        if (!movie.poster_path) continue;
        const details = await getMovieDetails(movie.id);
        if (details) {
          const transformed = transformMovieDetails(details);
          if (!processedIds.has(transformed.id)) {
            processedIds.add(transformed.id);
            results.push(transformed);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      const tvResults = await searchContent(search, 'tv');
      for (const series of tvResults.slice(0, 20)) {
        if (!series.poster_path) continue;
        const details = await getSeriesDetails(series.id);
        if (details) {
          const transformed = transformSeriesDetails(details);
          if (!processedIds.has(transformed.id)) {
            processedIds.add(transformed.id);
            results.push(transformed);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: results,
        count: results.length,
        message: `${results.length} résultats pour "${search}"` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch movies from multiple pages and categories
    if (type === 'all' || type === 'movies') {
      console.log('Fetching movies...');
      
      const movieEndpoints = [
        '/movie/popular',
        '/movie/top_rated',
        '/movie/now_playing',
        '/movie/upcoming',
      ];
      
      // Fetch from standard endpoints
      for (const endpoint of movieEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            for (const movie of response.results) {
              if (!movie.poster_path) continue;
              const id = `tmdb-movie-${movie.id}`;
              if (processedIds.has(id)) continue;
              processedIds.add(id);
              
              const details = await getMovieDetails(movie.id);
              if (details && details.overview) {
                results.push(transformMovieDetails(details));
              }
              
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      // Fetch by genre to get more variety
      const movieGenreIds = Object.values(GENRE_IDS.movies);
      for (const genreId of movieGenreIds) {
        for (let page = 1; page <= Math.min(pages, 3); page++) {
          try {
            const response = await fetchFromTMDB('/discover/movie', { 
              page: String(page),
              with_genres: String(genreId),
              sort_by: 'popularity.desc'
            });
            
            for (const movie of response.results) {
              if (!movie.poster_path) continue;
              const id = `tmdb-movie-${movie.id}`;
              if (processedIds.has(id)) continue;
              processedIds.add(id);
              
              const details = await getMovieDetails(movie.id);
              if (details && details.overview) {
                results.push(transformMovieDetails(details));
              }
              
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          } catch (error) {
            console.error(`Error fetching movies by genre ${genreId}:`, error);
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
      
      // Fetch from standard endpoints
      for (const endpoint of seriesEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            for (const series of response.results) {
              if (!series.poster_path) continue;
              const id = `tmdb-tv-${series.id}`;
              if (processedIds.has(id)) continue;
              processedIds.add(id);
              
              const details = await getSeriesDetails(series.id);
              if (details && details.overview) {
                results.push(transformSeriesDetails(details));
              }
              
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      // Fetch by genre to get more variety (kids, animation, etc.)
      const tvGenreIds = Object.values(GENRE_IDS.tv);
      for (const genreId of tvGenreIds) {
        for (let page = 1; page <= Math.min(pages, 3); page++) {
          try {
            const response = await fetchFromTMDB('/discover/tv', { 
              page: String(page),
              with_genres: String(genreId),
              sort_by: 'popularity.desc'
            });
            
            for (const series of response.results) {
              if (!series.poster_path) continue;
              const id = `tmdb-tv-${series.id}`;
              if (processedIds.has(id)) continue;
              processedIds.add(id);
              
              const details = await getSeriesDetails(series.id);
              if (details && details.overview) {
                results.push(transformSeriesDetails(details));
              }
              
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          } catch (error) {
            console.error(`Error fetching series by genre ${genreId}:`, error);
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
