import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { RefreshCw, TrendingUp, Eye, MousePointer, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdStats } from '@/hooks/useAdStats';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdStatsPanel = () => {
  const [period, setPeriod] = useState(7);
  const { dailyStats, adTypeStats, totalImpressions, totalClicks, overallCtr, isLoading, refetch } = useAdStats(period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Statistiques Publicitaires</h2>
          <p className="text-muted-foreground text-sm">
            Performance de vos publicités sur les {period} derniers jours
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  period === days
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {days}j
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye size={16} />
            <span className="text-xs">Impressions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
        </div>
        
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MousePointer size={16} />
            <span className="text-xs">Clics</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
        </div>
        
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent size={16} />
            <span className="text-xs">CTR</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{overallCtr}%</p>
        </div>
        
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp size={16} />
            <span className="text-xs">Types de pubs</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{adTypeStats.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Impressions Chart */}
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Impressions par jour</h3>
          <div className="h-[250px]">
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: fr })}
                  />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* CTR Trend Chart */}
        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Évolution du CTR</h3>
          <div className="h-[250px]">
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: fr })}
                    formatter={(value: number) => [`${value}%`, 'CTR']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats by Ad Type */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-4">Performance par type de publicité</h3>
        {adTypeStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Impressions</th>
                  <th className="pb-3 font-medium text-right">Clics</th>
                  <th className="pb-3 font-medium text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {adTypeStats.map((stat, index) => (
                  <tr key={index} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {stat.adType.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-muted-foreground">
                      {stat.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-sm text-muted-foreground">
                      {stat.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-medium ${
                        stat.ctr >= 1 ? 'text-green-500' : stat.ctr >= 0.5 ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}>
                        {stat.ctr}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Aucune statistique disponible pour cette période
          </div>
        )}
      </div>
    </div>
  );
};

export default AdStatsPanel;