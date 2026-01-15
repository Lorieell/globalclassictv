import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

interface AdStat {
  id: string;
  ad_id: string;
  zone_id: string | null;
  ad_type: string;
  event_type: 'impression' | 'click';
  created_at: string;
}

interface DailyStats {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface AdTypeStats {
  adType: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export const useAdStats = (days: number = 7) => {
  const startDate = subDays(new Date(), days);

  const { data: rawStats, isLoading, refetch } = useQuery({
    queryKey: ['ad-stats', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_stats')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdStat[];
    },
  });

  // Calculate daily stats
  const dailyStats: DailyStats[] = [];
  if (rawStats) {
    const grouped: { [date: string]: { impressions: number; clicks: number } } = {};
    
    rawStats.forEach(stat => {
      const date = format(new Date(stat.created_at), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = { impressions: 0, clicks: 0 };
      }
      if (stat.event_type === 'impression') {
        grouped[date].impressions++;
      } else if (stat.event_type === 'click') {
        grouped[date].clicks++;
      }
    });

    // Fill in missing days
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const stats = grouped[date] || { impressions: 0, clicks: 0 };
      const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
      dailyStats.unshift({
        date,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: Math.round(ctr * 100) / 100
      });
    }
  }

  // Calculate stats by ad type
  const adTypeStats: AdTypeStats[] = [];
  if (rawStats) {
    const grouped: { [type: string]: { impressions: number; clicks: number } } = {};
    
    rawStats.forEach(stat => {
      const type = stat.ad_type;
      if (!grouped[type]) {
        grouped[type] = { impressions: 0, clicks: 0 };
      }
      if (stat.event_type === 'impression') {
        grouped[type].impressions++;
      } else if (stat.event_type === 'click') {
        grouped[type].clicks++;
      }
    });

    Object.entries(grouped).forEach(([adType, stats]) => {
      const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
      adTypeStats.push({
        adType,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: Math.round(ctr * 100) / 100
      });
    });
  }

  // Calculate totals
  const totalImpressions = rawStats?.filter(s => s.event_type === 'impression').length || 0;
  const totalClicks = rawStats?.filter(s => s.event_type === 'click').length || 0;
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    dailyStats,
    adTypeStats,
    totalImpressions,
    totalClicks,
    overallCtr: Math.round(overallCtr * 100) / 100,
    isLoading,
    refetch
  };
};