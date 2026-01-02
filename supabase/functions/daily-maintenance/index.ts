import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TMDB API config
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
};

interface MaintenanceResult {
  languageUpdates: number;
  qualityUpdates: number;
  newSeriesAdded: number;
  skippedManual: number;
  errors: string[];
}

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

async function checkAndUpdateMedia(library: any[]): Promise<{ languageUpdates: number; qualityUpdates: number; errors: string[]; skippedManual: number }> {
  let languageUpdates = 0;
  let qualityUpdates = 0;
  let skippedManual = 0;
  const errors: string[] = [];
  
  for (const media of library) {
    try {
      // Skip manually added content - never modify it
      if (media.isManual === true) {
        skippedManual++;
        continue;
      }
      
      // Extract TMDB ID
      const tmdbIdMatch = media.id?.match(/tmdb-(movie|tv)-(\d+)/);
      if (!tmdbIdMatch) {
        // If no TMDB ID pattern, consider it manual content - skip
        skippedManual++;
        continue;
      }
      
      const [, type, id] = tmdbIdMatch;
      const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
      
      const details = await fetchFromTMDB(endpoint);
      
      // Check language
      const correctLanguage = getLanguageLabel(
        details.original_language,
        details.spoken_languages
      );
      if (media.language !== correctLanguage) {
        media.language = correctLanguage;
        languageUpdates++;
      }
      
      // Check quality
      const year = type === 'movie' 
        ? details.release_date?.split('-')[0] 
        : details.first_air_date?.split('-')[0];
      const correctQuality = getQualityLabel(details.vote_average, year || '');
      if (media.quality !== correctQuality) {
        media.quality = correctQuality;
        qualityUpdates++;
      }
      
      // NEVER remove videoUrls or seasons that user has added
      // Only update metadata, preserve user-added content
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      errors.push(`Error updating ${media.title}: ${error}`);
    }
  }
  
  return { languageUpdates, qualityUpdates, errors, skippedManual };
}

async function fetchNewSeries(): Promise<any[]> {
  const newSeries: any[] = [];
  
  try {
    // Fetch latest airing series
    const response = await fetchFromTMDB('/tv/on_the_air', { page: '1' });
    
    for (const series of response.results.slice(0, 10)) {
      if (!series.poster_path) continue;
      
      const details = await fetchFromTMDB(`/tv/${series.id}`);
      const genres = details.genres?.map((g: any) => g.name).join(', ') || 'Drame';
      const year = details.first_air_date?.split('-')[0] || '';
      
      newSeries.push({
        id: `tmdb-tv-${series.id}`,
        title: details.name,
        image: `${TMDB_IMAGE_BASE}${details.poster_path}`,
        type: 'Série',
        description: details.overview?.slice(0, 200) || 'Aucune description disponible.',
        synopsis: details.overview || 'Aucune description disponible.',
        genres,
        quality: getQualityLabel(details.vote_average, year),
        language: getLanguageLabel(details.original_language, details.spoken_languages),
        rating: details.vote_average,
        year,
        backdrop: details.backdrop_path ? `${TMDB_BACKDROP_BASE}${details.backdrop_path}` : '',
        tmdbId: series.id,
        seasons: [],
        videoUrls: '',
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('Error fetching new series:', error);
  }
  
  return newSeries;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'full', library = [] } = await req.json().catch(() => ({}));
    
    console.log(`Daily maintenance started: action=${action}, library size=${library.length}`);
    
    const result: MaintenanceResult = {
      languageUpdates: 0,
      qualityUpdates: 0,
      newSeriesAdded: 0,
      skippedManual: 0,
      errors: [],
    };
    
    // IMPORTANT: Never remove any content - only add or update metadata
    let updatedLibrary = [...library];
    
    // Check and update language/quality for existing media (skip manual content)
    if (action === 'full' || action === 'check') {
      console.log('Checking language and quality (skipping manual content)...');
      const checkResult = await checkAndUpdateMedia(updatedLibrary);
      result.languageUpdates = checkResult.languageUpdates;
      result.qualityUpdates = checkResult.qualityUpdates;
      result.skippedManual = checkResult.skippedManual;
      result.errors.push(...checkResult.errors);
    }
    
    // Fetch and add new series
    if (action === 'full' || action === 'add-series') {
      console.log('Fetching new series...');
      const newSeries = await fetchNewSeries();
      
      // Only add series that don't already exist
      const existingIds = new Set(updatedLibrary.map(m => m.id));
      for (const series of newSeries) {
        if (!existingIds.has(series.id)) {
          updatedLibrary.push(series);
          result.newSeriesAdded++;
        }
      }
    }
    
    console.log(`Maintenance complete: ${result.languageUpdates} language updates, ${result.qualityUpdates} quality updates, ${result.newSeriesAdded} new series`);
    
    return new Response(JSON.stringify({
      success: true,
      result,
      library: updatedLibrary,
      message: `Maintenance: ${result.languageUpdates} langues, ${result.qualityUpdates} qualités mises à jour, ${result.newSeriesAdded} nouvelles séries ajoutées`,
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
