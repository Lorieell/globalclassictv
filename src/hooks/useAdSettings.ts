import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AdvancedAdSettings } from '@/types/ads';
import { DEFAULT_AD_SETTINGS } from '@/types/ads';

const ADS_STORAGE_KEY = 'gctv-ads-settings';

export const useAdSettings = () => {
  const [settings, setSettings] = useState<AdvancedAdSettings>(DEFAULT_AD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from Supabase, fallback to localStorage for migration
  const loadSettings = useCallback(async () => {
    try {
      // First try Supabase
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
        // Check if it's the new format (has 'left' and 'right' properties with slideAd)
        const dbSettings = data.settings as any;
        if (dbSettings.left?.slideAd !== undefined) {
          setSettings(dbSettings as AdvancedAdSettings);
        } else {
          // Old format - migrate to new format
          const migratedSettings = migrateOldSettings(dbSettings);
          setSettings(migratedSettings);
          // Save migrated settings
          await saveSettings(migratedSettings);
        }
      } else {
        // Try localStorage for migration
        const stored = localStorage.getItem(ADS_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Check if old format
            if (parsed.leftEnabled !== undefined) {
              const migratedSettings = migrateOldSettings(parsed);
              setSettings(migratedSettings);
              // Save to Supabase
              await saveSettingsToDb(migratedSettings);
            } else if (parsed.left?.slideAd !== undefined) {
              setSettings(parsed as AdvancedAdSettings);
            }
          } catch (e) {
            console.error('Failed to parse localStorage ad settings:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error in loadSettings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Migrate old settings format to new format
  const migrateOldSettings = (oldSettings: any): AdvancedAdSettings => {
    return {
      left: {
        slideAd: {
          enabled: false,
          images: [],
          interval: 30,
        },
        staticAd: {
          enabled: oldSettings.leftEnabled || false,
          type: oldSettings.leftType || 'image',
          imageUrl: oldSettings.leftImageUrl || '',
          linkUrl: oldSettings.leftLinkUrl || '',
          adsenseCode: oldSettings.leftAdsenseCode || '',
        },
      },
      right: {
        slideAd: {
          enabled: false,
          images: [],
          interval: 30,
        },
        staticAd: {
          enabled: oldSettings.rightEnabled || false,
          type: oldSettings.rightType || 'image',
          imageUrl: oldSettings.rightImageUrl || '',
          linkUrl: oldSettings.rightLinkUrl || '',
          adsenseCode: oldSettings.rightAdsenseCode || '',
        },
      },
      heroSyncEnabled: true,
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

  // Save settings
  const saveSettings = async (newSettings: AdvancedAdSettings) => {
    setSaving(true);
    try {
      await saveSettingsToDb(newSettings);
      setSettings(newSettings);
      // Also update localStorage for backward compat and event dispatch
      localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(new Event('gctv-ads-updated'));
    } catch (e) {
      console.error('Error saving ad settings:', e);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Update a specific side's settings
  const updateSideSettings = useCallback(async (
    side: 'left' | 'right',
    updates: Partial<typeof settings.left>
  ) => {
    const newSettings = {
      ...settings,
      [side]: { ...settings[side], ...updates },
    };
    await saveSettings(newSettings);
  }, [settings]);

  // Toggle hero sync
  const toggleHeroSync = useCallback(async (enabled: boolean) => {
    const newSettings = { ...settings, heroSyncEnabled: enabled };
    await saveSettings(newSettings);
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
    settings,
    loading,
    saving,
    saveSettings,
    updateSideSettings,
    toggleHeroSync,
    reload: loadSettings,
  };
};
