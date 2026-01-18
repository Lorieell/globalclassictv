import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { generateSlug } from '@/pages/CataloguePage';

/**
 * Redirect component for legacy /player?id=X&s=Y&e=Z URLs
 * Converts them to the new /catalogue/:slug/saison-:num/episode-:num format
 */
const PlayerRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { library, loading } = useSupabaseMedia();
  
  const mediaId = searchParams.get('id');
  const seasonId = searchParams.get('s');
  const episodeId = searchParams.get('e');
  
  useEffect(() => {
    if (loading) return;
    
    if (!mediaId) {
      navigate('/', { replace: true });
      return;
    }
    
    const media = library.find(m => m.id === mediaId);
    
    if (!media) {
      navigate('/catalogue', { replace: true });
      return;
    }
    
    const slug = generateSlug(media.title);
    
    // Find season and episode numbers from IDs
    if (media.seasons && seasonId && episodeId) {
      const season = media.seasons.find(s => s.id === seasonId);
      if (season) {
        const episode = season.episodes?.find(e => e.id === episodeId);
        if (episode) {
          navigate(`/catalogue/${slug}/saison-${season.number}/episode-${episode.number}`, { replace: true });
          return;
        }
        // Episode not found, go to first episode of season
        navigate(`/catalogue/${slug}/saison-${season.number}/episode-1`, { replace: true });
        return;
      }
    }
    
    // No season/episode info, go to player base
    navigate(`/catalogue/${slug}/player`, { replace: true });
  }, [loading, library, mediaId, seasonId, episodeId, navigate]);
  
  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

export default PlayerRedirect;
