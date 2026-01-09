import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Admin client for database operations (only used after auth check)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to verify admin role
async function verifyAdminAuth(req: Request): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { isAdmin: false, error: 'Authorization header required' };
  }

  // Create client with user's token
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { isAdmin: false, error: 'Invalid or expired token' };
  }

  // Check admin role
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !roleData) {
    return { isAdmin: false, error: 'Admin access required', userId: user.id };
  }

  return { isAdmin: true, userId: user.id };
}

// API configurations
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const OMDB_BASE_URL = 'http://www.omdbapi.com';
const OMDB_API_KEY = Deno.env.get('OMDB_API_KEY') || '';

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
};

// TMDB genre IDs
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
    reality: 10764,
    scifi: 10765,
    war: 10768,
    western: 37,
  }
};

interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  release_date: string;
  vote_average: number;
  runtime: number;
  original_language: string;
  spoken_languages?: { iso_639_1: string; name: string }[];
  production_companies?: { name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  imdb_id?: string;
  budget?: number;
  revenue?: number;
  tagline?: string;
}

interface TMDBSeriesDetails {
  id: number;
  name: string;
  original_name: string;
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
  external_ids?: { imdb_id?: string };
  production_companies?: { name: string }[];
  tagline?: string;
}

interface TMDBCredits {
  cast: { name: string; character: string; order: number }[];
  crew: { name: string; job: string; department: string }[];
}

interface OMDBData {
  Title?: string;
  Poster?: string;
  imdbID?: string;
  Response?: string;
}

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status} ${response.statusText}`);
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

async function fetchFromOMDB(imdbId: string): Promise<OMDBData | null> {
  if (!OMDB_API_KEY || !imdbId) return null;
  
  try {
    const url = `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.Response === 'False') return null;
    return data;
  } catch (error) {
    console.error(`OMDB error for ${imdbId}:`, error);
    return null;
  }
}

async function getMovieDetails(id: number): Promise<{ details: TMDBMovieDetails | null; credits: TMDBCredits | null }> {
  try {
    const [details, credits] = await Promise.all([
      fetchFromTMDB(`/movie/${id}`),
      fetchFromTMDB(`/movie/${id}/credits`).catch(() => null)
    ]);
    return { details, credits };
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return { details: null, credits: null };
  }
}

async function getSeriesDetails(id: number): Promise<{ details: TMDBSeriesDetails | null; credits: TMDBCredits | null; externalIds: any }> {
  try {
    const [details, credits, externalIds] = await Promise.all([
      fetchFromTMDB(`/tv/${id}`),
      fetchFromTMDB(`/tv/${id}/credits`).catch(() => null),
      fetchFromTMDB(`/tv/${id}/external_ids`).catch(() => null)
    ]);
    if (externalIds) {
      details.external_ids = externalIds;
    }
    return { details, credits, externalIds };
  } catch (error) {
    console.error(`Error fetching series ${id}:`, error);
    return { details: null, credits: null, externalIds: null };
  }
}

function getLanguageLabel(movie: TMDBMovieDetails | TMDBSeriesDetails): string {
  const origLang = movie.original_language;
  
  // Check if French is in spoken languages
  const hasFrench = movie.spoken_languages?.some(l => l.iso_639_1 === 'fr');
  if (hasFrench || origLang === 'fr') {
    return 'VF';
  }
  
  return LANGUAGE_MAP[origLang] || 'VOSTFR';
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

// Filter out Quebec French content
function isQuebecFrench(details: any): boolean {
  const productionCountries = details.production_countries || details.origin_country || [];
  const isCanadian = productionCountries.some((c: any) => 
    (c.iso_3166_1 === 'CA' || c === 'CA') && details.original_language === 'fr'
  );
  return isCanadian;
}

// Filter out Asian content that doesn't have French title or isn't popular in France
const isEligibleForFrenchAudience = (item: any): boolean => {
  const origLang = item.original_language || '';
  const title = item.title || item.name || '';
  
  // Asian languages to filter
  const asianLanguages = ['zh', 'ko', 'ja', 'th', 'vi', 'id', 'ms', 'tl'];
  const isAsianContent = asianLanguages.includes(origLang);
  
  if (!isAsianContent) return true;
  
  // Check if title contains CJK characters (not translated to French)
  const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
  const hasAsianTitle = cjkPattern.test(title);
  
  if (hasAsianTitle) return false;
  
  // Check if it has French in spoken languages
  const hasFrench = item.spoken_languages?.some((l: any) => l.iso_639_1 === 'fr');
  
  // Allow if it has good rating (popular internationally)
  const hasGoodRating = (item.vote_average || 0) >= 7.5;
  const hasEnoughVotes = (item.vote_count || 0) >= 500;
  
  return hasFrench || (hasGoodRating && hasEnoughVotes);
};

async function transformMovieDetails(movie: TMDBMovieDetails, credits: TMDBCredits | null): Promise<any> {
  const genres = movie.genres.map(g => g.name);
  const year = movie.release_date?.split('-')[0] || '';
  const language = getLanguageLabel(movie);
  const quality = getQualityLabel(movie.vote_average, year);
  
  // Extract cast and crew
  const director = credits?.crew?.find(c => c.job === 'Director')?.name || '';
  const writers = credits?.crew?.filter(c => c.department === 'Writing').map(c => c.name).slice(0, 5) || [];
  const castMembers = credits?.cast?.slice(0, 10).map(c => c.name) || [];
  const characters = credits?.cast?.slice(0, 10).map(c => c.character) || [];
  const productionCompanies = movie.production_companies?.map(c => c.name) || [];
  
  return {
    title: movie.title,
    original_title: movie.original_title || null,
    description: movie.overview || 'Aucune description disponible.',
    type: 'film',
    // CRITICAL: poster_url for vertical displays, backdrop_url for horizontal displays
    poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '',
    backdrop_url: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null,
    genres,
    quality,
    language,
    rating: movie.vote_average,
    year,
    tmdb_id: movie.id,
    director,
    cast_members: castMembers,
    characters,
    writers,
    budget: movie.budget || null,
    revenue: movie.revenue || null,
    tagline: movie.tagline || null,
    original_language: movie.original_language || null,
    production_companies: productionCompanies,
    video_urls: [],
    seasons: [],
    is_featured: false,
  };
}

async function transformSeriesDetails(series: TMDBSeriesDetails, credits: TMDBCredits | null): Promise<any> {
  const genres = series.genres.map(g => g.name);
  const year = series.first_air_date?.split('-')[0] || '';
  const language = getLanguageLabel(series);
  const quality = getQualityLabel(series.vote_average, year);
  
  // Extract cast and crew
  const director = credits?.crew?.find(c => c.job === 'Director' || c.job === 'Executive Producer')?.name || '';
  const writers = credits?.crew?.filter(c => c.department === 'Writing').map(c => c.name).slice(0, 5) || [];
  const castMembers = credits?.cast?.slice(0, 10).map(c => c.name) || [];
  const characters = credits?.cast?.slice(0, 10).map(c => c.character) || [];
  const productionCompanies = series.production_companies?.map(c => c.name) || [];
  
  return {
    title: series.name,
    original_title: series.original_name || null,
    description: series.overview || 'Aucune description disponible.',
    type: 'serie',
    // CRITICAL: poster_url for vertical displays, backdrop_url for horizontal displays
    poster_url: series.poster_path ? `${TMDB_IMAGE_BASE}${series.poster_path}` : '',
    backdrop_url: series.backdrop_path ? `${TMDB_BACKDROP_BASE}${series.backdrop_path}` : null,
    genres,
    quality,
    language,
    rating: series.vote_average,
    year,
    tmdb_id: series.id,
    director,
    cast_members: castMembers,
    characters,
    writers,
    tagline: series.tagline || null,
    original_language: series.original_language || null,
    production_companies: productionCompanies,
    video_urls: [],
    seasons: [],
    is_featured: false,
  };
}

async function searchContent(query: string, type: 'movie' | 'tv'): Promise<any[]> {
  try {
    const response = await fetchFromTMDB(`/search/${type}`, { query });
    return (response.results || []).filter(isEligibleForFrenchAudience);
  } catch (error) {
    console.error(`Error searching ${type} for "${query}":`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type = 'all', pages = 2, search = '', saveToDb = false } = body;
    
    // SECURITY: Require admin auth for database write operations
    if (saveToDb) {
      const authResult = await verifyAdminAuth(req);
      if (!authResult.isAdmin) {
        console.log(`Auth failed for saveToDb: ${authResult.error}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: authResult.error || 'Admin access required for database operations'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`Admin authenticated: ${authResult.userId}`);
    }
    
    console.log(`Importing TMDB content: type=${type}, pages=${pages}, search=${search}`);
    
    const results: any[] = [];
    const processedIds = new Set<number>();
    
    // Handle search query
    if (search) {
      console.log(`Searching for: ${search}`);
      
      const movieResults = await searchContent(search, 'movie');
      for (const movie of movieResults.slice(0, 20)) {
        if (!movie.poster_path || processedIds.has(movie.id)) continue;
        processedIds.add(movie.id);
        
        const { details, credits } = await getMovieDetails(movie.id);
        if (details && details.overview && isEligibleForFrenchAudience(details) && !isQuebecFrench(details)) {
          results.push(await transformMovieDetails(details, credits));
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      const tvResults = await searchContent(search, 'tv');
      for (const series of tvResults.slice(0, 20)) {
        if (!series.poster_path || processedIds.has(series.id)) continue;
        processedIds.add(series.id);
        
        const { details, credits } = await getSeriesDetails(series.id);
        if (details && details.overview && isEligibleForFrenchAudience(details) && !isQuebecFrench(details)) {
          results.push(await transformSeriesDetails(details, credits));
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
    
    // Fetch movies
    if (type === 'all' || type === 'movies') {
      console.log('Fetching movies...');
      
      const movieEndpoints = ['/movie/popular', '/movie/top_rated', '/movie/now_playing', '/movie/upcoming'];
      
      for (const endpoint of movieEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            const moviesWithPoster = response.results
              .filter((m: any) => m.poster_path && m.backdrop_path) // REQUIRE backdrop
              .filter(isEligibleForFrenchAudience);
              
            for (let i = 0; i < moviesWithPoster.length; i += 5) {
              const batch = moviesWithPoster.slice(i, i + 5);
              const batchResults = await Promise.all(
                batch.map(async (movie: any) => {
                  if (processedIds.has(movie.id)) return null;
                  processedIds.add(movie.id);
                  
                  const { details, credits } = await getMovieDetails(movie.id);
                  if (details && details.overview && details.backdrop_path && isEligibleForFrenchAudience(details) && !isQuebecFrench(details)) {
                    return await transformMovieDetails(details, credits);
                  }
                  return null;
                })
              );
              results.push(...batchResults.filter(Boolean));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      console.log(`Fetched ${results.length} movies with full details`);
    }
    
    // Fetch series
    if (type === 'all' || type === 'series') {
      console.log('Fetching series...');
      
      const seriesEndpoints = ['/tv/popular', '/tv/top_rated', '/tv/on_the_air', '/tv/airing_today'];
      const seriesStartCount = results.length;
      
      for (const endpoint of seriesEndpoints) {
        for (let page = 1; page <= pages; page++) {
          try {
            const response = await fetchFromTMDB(endpoint, { page: String(page) });
            
            const seriesWithPoster = response.results
              .filter((s: any) => s.poster_path && s.backdrop_path) // REQUIRE backdrop
              .filter(isEligibleForFrenchAudience);
              
            for (let i = 0; i < seriesWithPoster.length; i += 5) {
              const batch = seriesWithPoster.slice(i, i + 5);
              const batchResults = await Promise.all(
                batch.map(async (series: any) => {
                  if (processedIds.has(series.id)) return null;
                  processedIds.add(series.id);
                  
                  const { details, credits } = await getSeriesDetails(series.id);
                  if (details && details.overview && details.backdrop_path && isEligibleForFrenchAudience(details) && !isQuebecFrench(details)) {
                    return await transformSeriesDetails(details, credits);
                  }
                  return null;
                })
              );
              results.push(...batchResults.filter(Boolean));
            }
          } catch (error) {
            console.error(`Error fetching ${endpoint} page ${page}:`, error);
          }
        }
      }
      
      console.log(`Fetched ${results.length - seriesStartCount} series with full details`);
    }

    console.log(`Total content fetched: ${results.length} items`);

    // Save to database if requested
    if (saveToDb && results.length > 0) {
      console.log('Saving to database...');
      let savedCount = 0;
      let skippedCount = 0;
      let skippedDeleted = 0;
      let skippedDuplicate = 0;
      
      // Get list of deleted TMDB IDs to exclude
      const { data: deletedTmdbIds } = await supabaseAdmin
        .from('deleted_tmdb_ids')
        .select('tmdb_id');
      const deletedSet = new Set((deletedTmdbIds || []).map(d => d.tmdb_id));
      console.log(`Found ${deletedSet.size} deleted TMDB IDs to exclude`);
      
      // Get existing tmdb_ids AND titles to check for duplicates
      const { data: existingMedia } = await supabaseAdmin
        .from('media')
        .select('id, tmdb_id, title')
        .not('tmdb_id', 'is', null);
      
      const existingTmdbIds = new Set((existingMedia || []).map(m => m.tmdb_id));
      const existingTitles = new Set((existingMedia || []).map(m => m.title.toLowerCase().trim()));
      
      for (const media of results) {
        // Skip if TMDB ID was previously deleted
        if (deletedSet.has(media.tmdb_id)) {
          skippedDeleted++;
          continue;
        }
        
        // Skip if TMDB ID already exists
        if (existingTmdbIds.has(media.tmdb_id)) {
          skippedCount++;
          continue;
        }
        
        // Skip if title already exists (prevents duplicates with manually added content)
        const normalizedTitle = media.title.toLowerCase().trim();
        if (existingTitles.has(normalizedTitle)) {
          console.log(`Skipping duplicate title: ${media.title}`);
          skippedDuplicate++;
          continue;
        }
        
        // Insert new content
        const { error } = await supabaseAdmin.from('media').insert(media);
        
        if (error) {
          console.error(`Error inserting ${media.title}:`, error.message);
        } else {
          savedCount++;
          existingTitles.add(normalizedTitle); // Add to set to prevent duplicates in same batch
        }
      }
      
      console.log(`Saved ${savedCount} new items, skipped ${skippedCount} existing, ${skippedDeleted} deleted, ${skippedDuplicate} duplicates`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        saved: savedCount,
        skipped: skippedCount,
        skippedDeleted,
        skippedDuplicate,
        total: results.length,
        message: `${savedCount} nouveaux contenus importés, ${skippedCount} existants, ${skippedDuplicate} doublons évités` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
