// Types for the advanced advertising system

export interface SlideImage {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

export interface SlideAd {
  id: string;
  type: 'slide';
  enabled: boolean;
  slideType: 'images' | 'propellerads'; // Type of slide content
  images: SlideImage[]; // Max 3 images
  interval: number; // Interval in seconds
  order: number; // Position order
  propellerZoneId: string; // PropellerAds Zone ID for slide
  propellerFormat: 'banner' | 'native' | 'push' | 'popunder' | 'interstitial'; // PropellerAds format
}

export interface StaticAd {
  id: string;
  type: 'static';
  enabled: boolean;
  adType: 'image' | 'adsense' | 'propellerads';
  imageUrl: string;
  linkUrl: string;
  adsenseCode: string;
  propellerZoneId: string; // PropellerAds Zone ID
  propellerFormat: 'banner' | 'native' | 'push' | 'popunder' | 'interstitial'; // PropellerAds format
  order: number; // Position order
}

export type Ad = SlideAd | StaticAd;

export interface SideAds {
  ads: Ad[];
}

export interface AdvancedAdSettings {
  left: SideAds;
  right: SideAds;
  heroSyncEnabled: boolean; // Sync slide ads with hero slider
}

// Helper to generate unique ID
export const generateAdId = () => Math.random().toString(36).substring(2, 9);

// Create new slide ad
export const createSlideAd = (order: number): SlideAd => ({
  id: generateAdId(),
  type: 'slide',
  enabled: true,
  slideType: 'images',
  images: [],
  interval: 30,
  order,
  propellerZoneId: '',
  propellerFormat: 'banner',
});

// Create new static ad
export const createStaticAd = (order: number): StaticAd => ({
  id: generateAdId(),
  type: 'static',
  enabled: true,
  adType: 'image',
  imageUrl: '',
  linkUrl: '',
  adsenseCode: '',
  propellerZoneId: '',
  propellerFormat: 'banner',
  order,
});

export const DEFAULT_AD_SETTINGS: AdvancedAdSettings = {
  left: {
    ads: [],
  },
  right: {
    ads: [],
  },
  heroSyncEnabled: true,
};
