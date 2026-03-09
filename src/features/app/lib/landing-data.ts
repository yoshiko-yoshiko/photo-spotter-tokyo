import { MapPin, Camera, Trophy, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: FeatureItem[] = [
  {
    icon: MapPin,
    title: "スポット登録",
    description: "地域の魅力的なスポットを地図上に登録。写真撮影のコツや見どころも掲載できます。",
  },
  {
    icon: Camera,
    title: "写真スタンプラリー",
    description: "スポットを訪れて写真を撮るとスタンプGET。ゲーム感覚で観光客の回遊を促進します。",
  },
  {
    icon: Trophy,
    title: "バッジ・クーポン報酬",
    description: "スタンプを集めるとバッジやクーポンを獲得。地元店舗への送客に直結します。",
  },
  {
    icon: Users,
    title: "写真タイムライン",
    description: "訪問者が撮った写真がタイムラインに。リアルなクチコミとして次の来訪者を呼びます。",
  },
];

export const BENEFITS = [
  "観光客の滞在時間・回遊率が向上",
  "地元店舗への送客（クーポン連携）",
  "訪問データの可視化・分析",
  "SNS投稿による自然な情報拡散",
  "イベント・季節に合わせた柔軟なスポット運用",
  "初期費用を抑えた導入（補助金活用可）",
];

export const STEPS = [
  { step: "01", title: "ヒアリング", description: "地域の課題や目的をお聞きし、最適なプランをご提案します。" },
  { step: "02", title: "スポット設計", description: "地域の魅力を最大限に引き出すスポットを一緒に選定します。" },
  { step: "03", title: "導入・公開", description: "最短2週間で公開。運用サポートも継続的に行います。" },
];
