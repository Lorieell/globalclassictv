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

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { isAdmin: false, error: 'Invalid or expired token' };
  }

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

// TMDB API config
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || '';
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
};

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

function getLanguageLabel(origLang: string, spokenLanguages?: { iso_639_1: string }[]): string {
  const hasFrench = spokenLanguages?.some(l => l.iso_639_1 === 'fr');
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

// Fetch detailed movie info from TMDB and update in database
async function updateMediaDetails(mediaId: string, tmdbId: number, mediaType: 'film' | 'serie') {
  try {
    const endpoint = mediaType === 'film' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const creditsEndpoint = mediaType === 'film' ? `/movie/${tmdbId}/credits` : `/tv/${tmdbId}/credits`;
    
    const [details, credits] = await Promise.all([
      fetchFromTMDB(endpoint),
      fetchFromTMDB(creditsEndpoint).catch(() => null)
    ]);
    
    if (!details) return null;
    
    // Extract all the details
    const genres = details.genres?.map((g: any) => g.name) || [];
    const year = (details.release_date || details.first_air_date)?.split('-')[0] || '';
    
    // Cast and crew
    const director = credits?.crew?.find((c: any) => c.job === 'Director' || c.job === 'Executive Producer')?.name || null;
    const writers = credits?.crew?.filter((c: any) => c.department === 'Writing').map((c: any) => c.name).slice(0, 5) || [];
    const castMembers = credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
    const characters = credits?.cast?.slice(0, 10).map((c: any) => c.character) || [];
    const productionCompanies = details.production_companies?.map((c: any) => c.name) || [];
    
    const updateData: any = {
      genres,
      year,
      rating: details.vote_average || null,
      director,
      cast_members: castMembers,
      characters,
      writers,
      original_language: details.original_language || null,
      original_title: details.original_title || details.original_name || null,
      tagline: details.tagline || null,
      production_companies: productionCompanies,
      quality: getQualityLabel(details.vote_average || 0, year),
      language: getLanguageLabel(details.original_language, details.spoken_languages),
      updated_at: new Date().toISOString(),
    };
    
    // Only for movies
    if (mediaType === 'film') {
      updateData.budget = details.budget || null;
      updateData.revenue = details.revenue || null;
      updateData.duration = details.runtime ? `${details.runtime} min` : null;
    }
    
    // CRITICAL: Update backdrop_url if it's missing or wrong
    if (details.backdrop_path) {
      updateData.backdrop_url = `${TMDB_BACKDROP_BASE}${details.backdrop_path}`;
    }
    
    // Update poster_url if needed
    if (details.poster_path) {
      updateData.poster_url = `${TMDB_IMAGE_BASE}${details.poster_path}`;
    }
    
    const { error } = await supabaseAdmin
      .from('media')
      .update(updateData)
      .eq('id', mediaId);
    
    if (error) {
      console.error(`Error updating media ${mediaId}:`, error.message);
      return null;
    }
    
    return updateData;
  } catch (error) {
    console.error(`Error fetching TMDB details for ${tmdbId}:`, error);
    return null;
  }
}

// Fetch new content from TMDB
async function fetchTodayContent(): Promise<any[]> {
  const results: any[] = [];
  
  try {
    console.log('Fetching new content from TMDB...');
    
    // Fetch recently released movies
    const moviesResponse = await fetchFromTMDB('/movie/now_playing', { page: '1' });
    
    for (const movie of moviesResponse.results.slice(0, 20)) {
      if (!movie.poster_path || !movie.backdrop_path) continue;
      
      const [details, credits] = await Promise.all([
        fetchFromTMDB(`/movie/${movie.id}`),
        fetchFromTMDB(`/movie/${movie.id}/credits`).catch(() => null)
      ]);
      
      const genres = details.genres?.map((g: any) => g.name) || [];
      const year = details.release_date?.split('-')[0] || '';
      const director = credits?.crew?.find((c: any) => c.job === 'Director')?.name || null;
      const castMembers = credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
      const characters = credits?.cast?.slice(0, 10).map((c: any) => c.character) || [];
      const writers = credits?.crew?.filter((c: any) => c.department === 'Writing').map((c: any) => c.name).slice(0, 5) || [];
      const productionCompanies = details.production_companies?.map((c: any) => c.name) || [];
      
      results.push({
        title: details.title,
        original_title: details.original_title || null,
        description: details.overview || 'Aucune description disponible.',
        type: 'film',
        poster_url: `${TMDB_IMAGE_BASE}${details.poster_path}`,
        backdrop_url: `${TMDB_BACKDROP_BASE}${details.backdrop_path}`,
        genres,
        quality: getQualityLabel(details.vote_average, year),
        language: getLanguageLabel(details.original_language, details.spoken_languages),
        rating: details.vote_average,
        year,
        tmdb_id: movie.id,
        director,
        cast_members: castMembers,
        characters,
        writers,
        budget: details.budget || null,
        revenue: details.revenue || null,
        tagline: details.tagline || null,
        original_language: details.original_language || null,
        production_companies: productionCompanies,
        video_urls: [],
        seasons: [],
        is_featured: false,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Fetch recently airing series
    const seriesResponse = await fetchFromTMDB('/tv/airing_today', { page: '1' });
    
    for (const series of seriesResponse.results.slice(0, 20)) {
      if (!series.poster_path || !series.backdrop_path) continue;
      
      const [details, credits] = await Promise.all([
        fetchFromTMDB(`/tv/${series.id}`),
        fetchFromTMDB(`/tv/${series.id}/credits`).catch(() => null)
      ]);
      
      const genres = details.genres?.map((g: any) => g.name) || [];
      const year = details.first_air_date?.split('-')[0] || '';
      const director = credits?.crew?.find((c: any) => c.job === 'Director' || c.job === 'Executive Producer')?.name || null;
      const castMembers = credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
      const characters = credits?.cast?.slice(0, 10).map((c: any) => c.character) || [];
      const writers = credits?.crew?.filter((c: any) => c.department === 'Writing').map((c: any) => c.name).slice(0, 5) || [];
      const productionCompanies = details.production_companies?.map((c: any) => c.name) || [];
      
      results.push({
        title: details.name,
        original_title: details.original_name || null,
        description: details.overview || 'Aucune description disponible.',
        type: 'serie',
        poster_url: `${TMDB_IMAGE_BASE}${details.poster_path}`,
        backdrop_url: `${TMDB_BACKDROP_BASE}${details.backdrop_path}`,
        genres,
        quality: getQualityLabel(details.vote_average, year),
        language: getLanguageLabel(details.original_language, details.spoken_languages),
        rating: details.vote_average,
        year,
        tmdb_id: series.id,
        director,
        cast_members: castMembers,
        characters,
        writers,
        tagline: details.tagline || null,
        original_language: details.original_language || null,
        production_companies: productionCompanies,
        video_urls: [],
        seasons: [],
        is_featured: false,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('Error fetching today content:', error);
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.isAdmin) {
      console.log(`Auth failed for maintenance: ${authResult.error}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: authResult.error || 'Admin access required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Admin authenticated for maintenance: ${authResult.userId}`);
    
    const { action = 'daily' } = await req.json().catch(() => ({}));
    
    console.log(`Daily maintenance started: action=${action}`);
    
    let newContentAdded = 0;
    let skippedExisting = 0;
    let updatedExisting = 0;
    const errors: string[] = [];
    
    // Get deleted TMDB IDs to exclude
    const { data: deletedTmdbIds } = await supabaseAdmin
      .from('deleted_tmdb_ids')
      .select('tmdb_id');
    const deletedSet = new Set((deletedTmdbIds || []).map(d => d.tmdb_id));
    
    // STEP 1: Update existing media with missing details (budget, revenue, backdrop, etc.)
    console.log('Updating existing media with full details from TMDB...');
    const { data: existingMedia } = await supabaseAdmin
      .from('media')
      .select('id, tmdb_id, type, backdrop_url')
      .not('tmdb_id', 'is', null);
    
    // Only update media that needs updating (missing backdrop, budget, etc.)
    const mediaToUpdate = (existingMedia || []).filter(m => 
      !m.backdrop_url // Missing backdrop
    ).slice(0, 50); // Limit to 50 per run to avoid timeout
    
    for (const media of mediaToUpdate) {
      const result = await updateMediaDetails(
        media.id, 
        media.tmdb_id, 
        media.type as 'film' | 'serie'
      );
      if (result) {
        updatedExisting++;
        console.log(`Updated: ${media.id}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
    }
    
    // STEP 2: Fetch new content from TMDB
    const newContent = await fetchTodayContent();
    console.log(`Found ${newContent.length} items from TMDB`);
    
    // Get existing tmdb_ids and titles
    const { data: allMedia } = await supabaseAdmin
      .from('media')
      .select('tmdb_id, title');
    
    const existingTmdbIds = new Set((allMedia || []).map(m => m.tmdb_id).filter(Boolean));
    const existingTitles = new Set((allMedia || []).map(m => m.title?.toLowerCase().trim()).filter(Boolean));
    
    // Insert only new content
    for (const media of newContent) {
      // Skip deleted TMDB IDs
      if (deletedSet.has(media.tmdb_id)) {
        skippedExisting++;
        continue;
      }
      
      // Skip existing TMDB IDs
      if (existingTmdbIds.has(media.tmdb_id)) {
        skippedExisting++;
        continue;
      }
      
      // Skip duplicate titles
      const normalizedTitle = media.title?.toLowerCase().trim();
      if (normalizedTitle && existingTitles.has(normalizedTitle)) {
        console.log(`Skipping duplicate title: ${media.title}`);
        skippedExisting++;
        continue;
      }
      
      const { error } = await supabaseAdmin.from('media').insert(media);
      
      if (error) {
        console.error(`Error inserting ${media.title}:`, error.message);
        errors.push(`${media.title}: ${error.message}`);
      } else {
        newContentAdded++;
        existingTitles.add(normalizedTitle);
        console.log(`Added: ${media.title}`);
      }
    }
    
    const result = {
      newContentAdded,
      skippedExisting,
      updatedExisting,
      errors,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`Maintenance complete: ${newContentAdded} new, ${updatedExisting} updated, ${skippedExisting} skipped`);
    
    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Maintenance: ${newContentAdded} nouveaux, ${updatedExisting} mis à jour, ${skippedExisting} existants`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Maintenance error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
