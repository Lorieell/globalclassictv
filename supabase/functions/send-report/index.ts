import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPORT_EMAIL = 'loriesell.contact@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaTitle, mediaId, season, episode, playerIndex, message, url } = await req.json();

    console.log('Report received:', { mediaTitle, season, episode, playerIndex, message });

    // Format the report
    const subject = `[GCTV] Problème lecteur: ${mediaTitle}`;
    const body = `
Signalement de problème de lecteur

Média: ${mediaTitle}
ID: ${mediaId}
${season ? `Saison: ${season}` : ''}
${episode ? `Épisode: ${episode}` : ''}
Lecteur: ${playerIndex}
URL: ${url}

Message de l'utilisateur:
${message}

---
Envoyé depuis Global Classic TV
Date: ${new Date().toLocaleString('fr-FR')}
    `.trim();

    // For now, just log the report. In production, you would:
    // 1. Use a service like Resend, SendGrid, or Supabase's email capabilities
    // 2. Or store in database for admin review
    
    console.log('=== REPORT TO SEND ===');
    console.log('To:', REPORT_EMAIL);
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('======================');

    // Store report in a simple way - we'll create a notifications entry for admin
    // Or you can integrate with an email service later

    return new Response(JSON.stringify({
      success: true,
      message: 'Report received successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Report error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});