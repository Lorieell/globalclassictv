import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate AdSense code for security
const isValidAdSenseCode = (code: string): { valid: boolean; reason?: string } => {
  if (!code || typeof code !== 'string') {
    return { valid: true }; // Empty is ok
  }

  const trimmed = code.trim();
  if (trimmed === '') {
    return { valid: true };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*(?!.*adsbygoogle)[^>]*>/i, // Scripts other than adsbygoogle
    /on\w+\s*=/i, // Event handlers like onclick=, onerror=
    /javascript:/i, // javascript: URLs
    /data:/i, // data: URLs
    /<iframe/i, // iframes
    /<object/i, // object tags
    /<embed/i, // embed tags
    /<form/i, // form tags
    /<input/i, // input tags
    /document\./i, // document manipulation
    /window\./i, // window manipulation
    /eval\s*\(/i, // eval calls
    /Function\s*\(/i, // Function constructor
    /localStorage/i, // storage access
    /sessionStorage/i,
    /cookie/i, // cookie access
    /fetch\s*\(/i, // fetch calls
    /XMLHttpRequest/i, // XHR calls
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { 
        valid: false, 
        reason: `Code contient un pattern dangereux: ${pattern.source}` 
      };
    }
  }

  // Must contain adsbygoogle reference if it has content
  if (!trimmed.includes('adsbygoogle')) {
    return { 
      valid: false, 
      reason: 'Le code doit contenir une référence à adsbygoogle' 
    };
  }

  // Check for valid AdSense patterns
  const hasValidInsTag = /<ins\s+class="adsbygoogle"/i.test(trimmed);
  const hasDataAdClient = /data-ad-client="ca-pub-\d+"/i.test(trimmed);
  const hasDataAdSlot = /data-ad-slot="\d+"/i.test(trimmed);
  const hasPushCall = /adsbygoogle.*\.push\s*\(\s*\{\s*\}\s*\)/i.test(trimmed);

  if (!hasValidInsTag) {
    return { 
      valid: false, 
      reason: 'Le code doit contenir une balise <ins class="adsbygoogle">' 
    };
  }

  if (!hasDataAdClient) {
    return { 
      valid: false, 
      reason: 'Le code doit contenir data-ad-client="ca-pub-XXXXX"' 
    };
  }

  return { valid: true };
};

// Validate entire ad settings object
const validateAdSettings = (settings: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!settings || typeof settings !== 'object') {
    return { valid: false, errors: ['Settings invalides'] };
  }

  // Check left side ads
  if (settings.left?.ads && Array.isArray(settings.left.ads)) {
    for (const ad of settings.left.ads) {
      if (ad.adType === 'adsense' && ad.adsenseCode) {
        const result = isValidAdSenseCode(ad.adsenseCode);
        if (!result.valid) {
          errors.push(`Pub gauche ${ad.id}: ${result.reason}`);
        }
      }
    }
  }

  // Check right side ads
  if (settings.right?.ads && Array.isArray(settings.right.ads)) {
    for (const ad of settings.right.ads) {
      if (ad.adType === 'adsense' && ad.adsenseCode) {
        const result = isValidAdSenseCode(ad.adsenseCode);
        if (!result.valid) {
          errors.push(`Pub droite ${ad.id}: ${result.reason}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings, action } = await req.json();

    console.log('Validate AdSense request:', { action, settingsKeys: Object.keys(settings || {}) });

    if (action === 'validate') {
      // Just validate without saving
      const result = validateAdSettings(settings);
      console.log('Validation result:', result);

      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'validate_and_save') {
      // Validate first
      const validation = validateAdSettings(settings);
      
      if (!validation.valid) {
        console.log('Validation failed:', validation.errors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: validation.errors 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      // Save to database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('ad_settings')
        .upsert({
          id: 'default',
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: ['Erreur de sauvegarde en base de données'] 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log('Settings saved successfully');
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action invalide' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in validate-adsense:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
