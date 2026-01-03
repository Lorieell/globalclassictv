import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AdvancedAdSettings, Ad } from '@/types/ads';
import { DEFAULT_AD_SETTINGS } from '@/types/ads';
import { toast } from 'sonner';

const ADS_STORAGE_KEY = 'gctv-ads-settings';

export const useAdSettings = () => {
  const [settings, setSettings] = useState<AdvancedAdSettings>(DEFAULT_AD_SETTINGS);
  const [localSettings, setLocalSettings] = useState<AdvancedAdSettings>(DEFAULT_AD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialLoadDone = useRef(false);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('settings')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading ad settings from Supabase:', error);
      }

      if (data?.settings) {
        const dbSettings = data.settings as any;
        // Check if it's the new format with ads array
        if (dbSettings.left?.ads !== undefined) {
          setSettings(dbSettings as AdvancedAdSettings);
          if (!initialLoadDone.current) {
            setLocalSettings(dbSettings as AdvancedAdSettings);
            initialLoadDone.current = true;
          }
        } else {
          // Old format - migrate to new format
          const migratedSettings = migrateOldSettings(dbSettings);
          setSettings(migratedSettings);
          if (!initialLoadDone.current) {
            setLocalSettings(migratedSettings);
            initialLoadDone.current = true;
          }
          // Save migrated settings
          await saveSettingsToDb(migratedSettings);
        }
      } else {
        initialLoadDone.current = true;
      }
    } catch (e) {
      console.error('Error in loadSettings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Migrate old settings format to new format
  const migrateOldSettings = (oldSettings: any): AdvancedAdSettings => {
    const leftAds: Ad[] = [];
    const rightAds: Ad[] = [];

    // Check for old slideAd/staticAd format
    if (oldSettings.left?.slideAd || oldSettings.left?.staticAd) {
      if (oldSettings.left?.slideAd?.enabled && oldSettings.left?.slideAd?.images?.length > 0) {
        leftAds.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'slide',
          enabled: true,
          images: oldSettings.left.slideAd.images,
          interval: oldSettings.left.slideAd.interval || 30,
          order: 0,
        });
      }
      if (oldSettings.left?.staticAd?.enabled) {
        leftAds.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'static',
          enabled: true,
          adType: oldSettings.left.staticAd.type || 'image',
          imageUrl: oldSettings.left.staticAd.imageUrl || '',
          linkUrl: oldSettings.left.staticAd.linkUrl || '',
          adsenseCode: oldSettings.left.staticAd.adsenseCode || '',
          order: 1,
        });
      }
      if (oldSettings.right?.slideAd?.enabled && oldSettings.right?.slideAd?.images?.length > 0) {
        rightAds.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'slide',
          enabled: true,
          images: oldSettings.right.slideAd.images,
          interval: oldSettings.right.slideAd.interval || 30,
          order: 0,
        });
      }
      if (oldSettings.right?.staticAd?.enabled) {
        rightAds.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'static',
          enabled: true,
          adType: oldSettings.right.staticAd.type || 'image',
          imageUrl: oldSettings.right.staticAd.imageUrl || '',
          linkUrl: oldSettings.right.staticAd.linkUrl || '',
          adsenseCode: oldSettings.right.staticAd.adsenseCode || '',
          order: 1,
        });
      }
    }

    return {
      left: { ads: leftAds },
      right: { ads: rightAds },
      heroSyncEnabled: oldSettings.heroSyncEnabled ?? true,
    };
  };

  // Save to Supabase
  const saveSettingsToDb = async (newSettings: AdvancedAdSettings) => {
    const { data: existing } = await supabase
      .from('ad_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('ad_settings')
        .update({ settings: newSettings as any, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('ad_settings')
        .insert({ settings: newSettings as any });
    }
  };

  // Update local settings (without saving to DB)
  const updateLocalSettings = useCallback((newSettings: AdvancedAdSettings) => {
    setLocalSettings(newSettings);
    setHasChanges(true);
  }, []);

  // Add ad to a side
  const addAd = useCallback((side: 'left' | 'right', ad: Ad) => {
    const newSettings = {
      ...localSettings,
      [side]: {
        ads: [...localSettings[side].ads, ad],
      },
    };
    updateLocalSettings(newSettings);
  }, [localSettings, updateLocalSettings]);

  // Remove ad from a side
  const removeAd = useCallback((side: 'left' | 'right', adId: string) => {
    const newSettings = {
      ...localSettings,
      [side]: {
        ads: localSettings[side].ads.filter(ad => ad.id !== adId),
      },
    };
    updateLocalSettings(newSettings);
  }, [localSettings, updateLocalSettings]);

  // Update a specific ad
  const updateAd = useCallback((side: 'left' | 'right', adId: string, updates: Partial<Ad>) => {
    const newSettings = {
      ...localSettings,
      [side]: {
        ads: localSettings[side].ads.map(ad =>
          ad.id === adId ? { ...ad, ...updates } as Ad : ad
        ),
      },
    };
    updateLocalSettings(newSettings);
  }, [localSettings, updateLocalSettings]);

  // Move ad up or down
  const moveAd = useCallback((side: 'left' | 'right', adId: string, direction: 'up' | 'down') => {
    const ads = [...localSettings[side].ads].sort((a, b) => a.order - b.order);
    const index = ads.findIndex(ad => ad.id === adId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ads.length) return;

    // Swap orders
    const temp = ads[index].order;
    ads[index] = { ...ads[index], order: ads[newIndex].order };
    ads[newIndex] = { ...ads[newIndex], order: temp };

    const newSettings = {
      ...localSettings,
      [side]: { ads },
    };
    updateLocalSettings(newSettings);
  }, [localSettings, updateLocalSettings]);

  // Toggle hero sync
  const toggleHeroSync = useCallback((enabled: boolean) => {
    const newSettings = { ...localSettings, heroSyncEnabled: enabled };
    updateLocalSettings(newSettings);
  }, [localSettings, updateLocalSettings]);

  // Save all changes
  const saveAllChanges = useCallback(async () => {
    setSaving(true);
    try {
      await saveSettingsToDb(localSettings);
      setSettings(localSettings);
      setHasChanges(false);
      localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(localSettings));
      window.dispatchEvent(new Event('gctv-ads-updated'));
      toast.success('Paramètres publicitaires sauvegardés');
    } catch (e) {
      console.error('Error saving ad settings:', e);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [localSettings]);

  // Discard changes
  const discardChanges = useCallback(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // Initial load
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for updates from other tabs/components
  useEffect(() => {
    const handleUpdate = () => loadSettings();
    window.addEventListener('gctv-ads-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gctv-ads-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadSettings]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ad-settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_settings' },
        () => loadSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  return {
    settings, // Saved settings (for display)
    localSettings, // Local edits (for editor)
    loading,
    saving,
    hasChanges,
    addAd,
    removeAd,
    updateAd,
    moveAd,
    toggleHeroSync,
    saveAllChanges,
    discardChanges,
    reload: loadSettings,
  };
};
