export interface ProfileStats {
  stampCount: number;
  photoCount: number;
  spotCount: number;
  rewardCount: number;
}

export interface UserProfile {
  nickname: string;
  avatar_url: string | null;
}
