import { Camera, MapPin, Trophy } from 'lucide-react';

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-900 p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="rounded-[2rem] overflow-hidden bg-white">
          {/* Status bar */}
          <div className="h-8 bg-[hsl(174,83%,32%)] flex items-end justify-center pb-1">
            <span className="text-[10px] text-white/80 font-medium">Photo Spotter</span>
          </div>
          {/* Map area */}
          <div className="h-40 bg-gradient-to-b from-[hsl(174,83%,90%)] to-[hsl(174,83%,95%)] relative">
            {/* Map pins */}
            <div className="absolute top-6 left-8">
              <div className="w-6 h-6 bg-[hsl(174,83%,32%)] rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="absolute top-16 right-12">
              <div className="w-6 h-6 bg-[hsl(25,95%,53%)] rounded-full flex items-center justify-center shadow-md">
                <MapPin className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/4">
              <div className="w-6 h-6 bg-[hsl(174,83%,32%)] rounded-full flex items-center justify-center shadow-md">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            </div>
            {/* Map grid lines */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-px bg-gray-400 absolute top-1/3 w-full" />
              <div className="h-px bg-gray-400 absolute top-2/3 w-full" />
              <div className="w-px bg-gray-400 absolute left-1/3 h-full" />
              <div className="w-px bg-gray-400 absolute left-2/3 h-full" />
            </div>
          </div>
          {/* Spot card */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
              <div className="w-10 h-10 rounded-lg bg-[hsl(174,83%,32%)]/10 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-[hsl(174,83%,32%)]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-900 truncate">東京タワー展望台</div>
                <div className="text-[9px] text-gray-500">スタンプ 3/5 達成</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-gradient-to-r from-[hsl(174,83%,32%)] to-[hsl(174,83%,42%)] rounded-full" />
            </div>
          </div>
          {/* Bottom nav */}
          <div className="flex justify-around py-2.5 border-t border-gray-100">
            <div className="flex flex-col items-center gap-0.5">
              <MapPin className="w-4 h-4 text-[hsl(174,83%,32%)]" />
              <span className="text-[8px] text-[hsl(174,83%,32%)] font-medium">マップ</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Camera className="w-4 h-4 text-gray-300" />
              <span className="text-[8px] text-gray-300">撮影</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Trophy className="w-4 h-4 text-gray-300" />
              <span className="text-[8px] text-gray-300">バッジ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
