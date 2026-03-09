import { useState } from 'react';
import { Camera, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-6 h-6 text-[hsl(174,83%,32%)]" />
          <span className="font-bold text-lg">Photo Spotter</span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" onClick={(e) => smoothScroll(e, "features")} className="hover:text-gray-900 transition-colors">機能</a>
          <a href="#benefits" onClick={(e) => smoothScroll(e, "benefits")} className="hover:text-gray-900 transition-colors">導入メリット</a>
          <a href="#flow" onClick={(e) => smoothScroll(e, "flow")} className="hover:text-gray-900 transition-colors">導入の流れ</a>
          <Link to="/map" className="inline-flex items-center gap-1 px-4 py-2 bg-[hsl(174,83%,32%)] text-white rounded-lg hover:bg-[hsl(174,80%,25%)] transition-colors">
            デモを見る
          </Link>
        </nav>
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a href="#features" onClick={(e) => { smoothScroll(e, "features"); setMenuOpen(false); }} className="block text-gray-700 py-2 hover:text-[hsl(174,83%,32%)] transition-colors">機能</a>
          <a href="#benefits" onClick={(e) => { smoothScroll(e, "benefits"); setMenuOpen(false); }} className="block text-gray-700 py-2 hover:text-[hsl(174,83%,32%)] transition-colors">導入メリット</a>
          <a href="#flow" onClick={(e) => { smoothScroll(e, "flow"); setMenuOpen(false); }} className="block text-gray-700 py-2 hover:text-[hsl(174,83%,32%)] transition-colors">導入の流れ</a>
          <Link to="/map" onClick={() => setMenuOpen(false)} className="block text-center py-3 bg-[hsl(174,83%,32%)] text-white rounded-lg hover:bg-[hsl(174,80%,25%)] transition-colors">
            デモを見る
          </Link>
        </div>
      )}
    </header>
  );
}
