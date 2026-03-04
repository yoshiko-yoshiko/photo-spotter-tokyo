import type { MicroCMSListContent } from 'microcms-js-sdk';

/** microCMS のスポットデータ（APIレスポンスそのまま） */
export type CMSSpot = {
  name: string;
  slug: string;
  description: string;
  category: string[];
  area: string;
  address?: string;
  photoTip?: string;
  bestTime?: string;
  image?: { url: string; width: number; height: number };
  imageUrl?: string;
} & MicroCMSListContent;

/** フロントエンドで使う統一Spot型（snake_case、既存コードとの互換性維持） */
export type Spot = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  area: string;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_tip: string | null;
  best_time: string | null;
  radius_m: number;
  image_url: string | null;
  is_active: boolean;
};
