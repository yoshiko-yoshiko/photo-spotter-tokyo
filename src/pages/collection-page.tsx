import { Grid3X3 } from 'lucide-react';

export default function CollectionPage() {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-16 h-16 rounded-full bg-stamp-gold/10 flex items-center justify-center mb-4">
        <Grid3X3 className="w-8 h-8 text-stamp-gold" />
      </div>
      <h2 className="text-lg font-bold text-foreground">📒 コレクション</h2>
      <p className="text-muted-foreground text-sm mt-2">Phase 3で実装します</p>
    </div>
  );
}
