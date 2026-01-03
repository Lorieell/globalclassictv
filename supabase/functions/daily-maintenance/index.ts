import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  if (releaseYear >= 2010) {
    return 'HD';
  }
  return 'HD';
}

// Fetch new movies/series from today's releases
async function fetchTodayContent(): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  const results: any[] = [];
  
  try {
    console.log(`Fetching content released on or after ${today}...`);
    
    // Fetch recently released movies
    const moviesResponse = await fetchFromTMDB('/movie/now_playing', { page: '1' });
    
    for (const movie of moviesResponse.results.slice(0, 20)) {
      if (!movie.poster_path) continue;
      
      const details = await fetchFromTMDB(`/movie/${movie.id}`);
      const genres = details.genres?.map((g: any) => g.name) || [];
      const year = details.release_date?.split('-')[0] || '';
      
      results.push({
        title: details.title,
        description: details.overview || 'Aucune description disponible.',
        type: 'film',
        poster_url: `${TMDB_IMAGE_BASE}${details.poster_path}`,
        backdrop_url: details.backdrop_path ? `${TMDB_BACKDROP_BASE}${details.backdrop_path}` : null,
        genres,
        quality: getQualityLabel(details.vote_average, year),
        language: getLanguageLabel(details.original_language, details.spoken_languages),
        rating: details.vote_average,
        year,
        tmdb_id: movie.id,
        video_urls: [],
        seasons: [],
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Fetch recently airing series
    const seriesResponse = await fetchFromTMDB('/tv/airing_today', { page: '1' });
    
    for (const series of seriesResponse.results.slice(0, 20)) {
      if (!series.poster_path) continue;
      
      const details = await fetchFromTMDB(`/tv/${series.id}`);
      const genres = details.genres?.map((g: any) => g.name) || [];
      const year = details.first_air_date?.split('-')[0] || '';
      
      results.push({
        title: details.name,
        description: details.overview || 'Aucune description disponible.',
        type: 'serie',
        poster_url: `${TMDB_IMAGE_BASE}${details.poster_path}`,
        backdrop_url: details.backdrop_path ? `${TMDB_BACKDROP_BASE}${details.backdrop_path}` : null,
        genres,
        quality: getQualityLabel(details.vote_average, year),
        language: getLanguageLabel(details.original_language, details.spoken_languages),
        rating: details.vote_average,
        year,
        tmdb_id: series.id,
        video_urls: [],
        seasons: [],
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
    const { action = 'daily' } = await req.json().catch(() => ({}));
    
    console.log(`Daily maintenance started: action=${action}`);
    
    let newContentAdded = 0;
    let skippedExisting = 0;
    const errors: string[] = [];
    
    // Fetch today's new content from TMDB
    const newContent = await fetchTodayContent();
    console.log(`Found ${newContent.length} items from TMDB`);
    
    // Get existing tmdb_ids from database
    const { data: existingMedia } = await supabase
      .from('media')
      .select('tmdb_id')
      .not('tmdb_id', 'is', null);
    
    const existingTmdbIds = new Set((existingMedia || []).map(m => m.tmdb_id));
    
    // Insert only new content
    for (const media of newContent) {
      if (existingTmdbIds.has(media.tmdb_id)) {
        skippedExisting++;
        continue;
      }
      
      const { error } = await supabase.from('media').insert(media);
      
      if (error) {
        console.error(`Error inserting ${media.title}:`, error.message);
        errors.push(`${media.title}: ${error.message}`);
      } else {
        newContentAdded++;
        console.log(`Added: ${media.title}`);
      }
    }
    
    const result = {
      newContentAdded,
      skippedExisting,
      errors,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`Maintenance complete: ${newContentAdded} new items, ${skippedExisting} skipped`);
    
    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Maintenance quotidienne: ${newContentAdded} nouveaux contenus ajoutés, ${skippedExisting} déjà existants`,
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
