// Types for the advanced advertising system

export interface SlideImage {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

export interface SlideAd {
  enabled: boolean;
  images: SlideImage[]; // Max 3 images
  interval: number; // Interval in seconds (synced with hero slider by default)
}

export interface StaticAd {
  enabled: boolean;
  type: 'image' | 'adsense';
  imageUrl: string;
  linkUrl: string;
  adsenseCode: string;
}

export interface SideAdSettings {
  slideAd: SlideAd;
  staticAd: StaticAd;
}

export interface AdvancedAdSettings {
  left: SideAdSettings;
  right: SideAdSettings;
  heroSyncEnabled: boolean; // Sync slide ads with hero slider
}

export const DEFAULT_AD_SETTINGS: AdvancedAdSettings = {
  left: {
    slideAd: {
      enabled: false,
      images: [],
      interval: 30, // Same as hero slider (30 seconds)
    },
    staticAd: {
      enabled: false,
      type: 'image',
      imageUrl: '',
      linkUrl: '',
      adsenseCode: '',
    },
  },
  right: {
    slideAd: {
      enabled: false,
      images: [],
      interval: 30,
    },
    staticAd: {
      enabled: false,
      type: 'image',
      imageUrl: '',
      linkUrl: '',
      adsenseCode: '',
    },
  },
  heroSyncEnabled: true,
};
