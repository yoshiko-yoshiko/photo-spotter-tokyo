import { Camera, ArrowRight, Smartphone, CheckCircle2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { LandingHeader } from "../components/landing-header";
import { PhoneMockup } from "../components/phone-mockup";
import { FEATURES, BENEFITS, STEPS } from "../lib/landing-data";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-4 tracking-wide">
              地域×写真×スタンプラリー
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              写真を撮って街を巡る。
              <br />
              <span className="text-[hsl(174,83%,32%)]">地域の魅力</span>を再発見。
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
              Photo Spotterは、写真スタンプラリーで観光客の回遊を促進する
              地域活性化プラットフォームです。
              スマホひとつで、あなたの街の魅力を届けます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[hsl(174,83%,32%)] text-white rounded-xl text-lg font-medium hover:bg-[hsl(174,80%,25%)] transition-colors shadow-lg shadow-[hsl(174,83%,32%)]/20"
              >
                デモを見る <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                デモを見る <Smartphone className="w-5 h-5" />
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: "50+", label: "登録スポット" },
              { value: "2週間", label: "最短導入期間" },
              { value: "0円", label: "初期費用から" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[hsl(174,83%,32%)]">{value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-2">FEATURES</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">主な機能</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 md:p-8 rounded-2xl border border-gray-100 hover:border-[hsl(174,83%,32%)]/30 hover:shadow-lg transition-all">
                <f.icon className="w-10 h-10 text-[hsl(174,83%,32%)] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-2">HOW IT WORKS</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">利用者の体験</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { num: "1", title: "地図でスポットを探す", desc: "近くの撮影スポットが一目でわかる。写真のコツや見どころも確認できます。" },
              { num: "2", title: "写真を撮ってスタンプGET", desc: "スポットに到着したら写真を撮影。自動でスタンプが記録されます。" },
              { num: "3", title: "報酬をゲット", desc: "スタンプを集めてバッジやクーポンを獲得。地元のお店でお得に楽しめます。" },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(174,83%,32%)] text-white flex items-center justify-center text-2xl font-bold">
                  {item.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-2">BENEFITS</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">導入メリット</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4">
                <CheckCircle2 className="w-6 h-6 text-[hsl(174,83%,32%)] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-base sm:text-lg">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[hsl(174,83%,32%)]/5 to-[hsl(25,95%,53%)]/5 border border-[hsl(174,83%,32%)]/10">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <BarChart3 className="w-8 h-8 text-[hsl(174,83%,32%)] flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">データで効果を可視化</h3>
                <p className="text-gray-600">
                  どのスポットが人気か、どの時間帯に訪問が多いか、クーポンの利用率は —
                  管理画面からリアルタイムで確認できます。
                  次の施策に活かせるデータが自然に蓄積されます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-2">USE CASES</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">活用シーン</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "自治体の観光施策", desc: "市内の観光スポットを巡るスタンプラリーで、観光客の滞在時間を延ばし、地域経済を活性化。", tag: "自治体向け" },
              { title: "商店街の集客イベント", desc: "店舗をスポットに設定し、来店でスタンプ。クーポン連携で購買にも繋がります。", tag: "商店街向け" },
              { title: "季節イベント・祭り", desc: "期間限定のスタンプラリーで、イベントの回遊性と参加者の満足度をアップ。", tag: "イベント向け" },
            ].map((uc) => (
              <div key={uc.title} className="p-6 bg-white rounded-2xl border border-gray-100">
                <span className="inline-block text-xs font-medium text-[hsl(174,83%,32%)] bg-[hsl(174,83%,32%)]/10 px-3 py-1 rounded-full mb-4">
                  {uc.tag}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="py-16 md:py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[hsl(174,83%,32%)] font-medium mb-2">FLOW</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">導入の流れ</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2" />
                )}
                <div className="text-5xl font-bold text-[hsl(174,83%,32%)]/20 mb-2">{s.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span>Photo Spotter</span>
          </div>
          <div className="flex gap-6">
            <Link to="/map" className="hover:text-white transition-colors">デモ</Link>
            <a href="#features" className="hover:text-white transition-colors">機能</a>
            <a href="#benefits" className="hover:text-white transition-colors">導入メリット</a>
          </div>
          <p>&copy; 2026 Photo Spotter</p>
        </div>
      </footer>
    </div>
  );
}
