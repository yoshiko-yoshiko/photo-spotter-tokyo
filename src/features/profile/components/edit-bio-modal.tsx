import { LIMITS } from '@/lib/constants';

interface EditBioModalProps {
  bio: string;
  onBioChange: (bio: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditBioModal({ bio, onBioChange, onSave, onCancel }: EditBioModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slide-up">
        <h3 className="text-lg font-bold text-foreground mb-4">自己紹介の編集</h3>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          maxLength={LIMITS.BIO_MAX}
          rows={3}
          placeholder="自己紹介を入力..."
          className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
        />
        <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/{LIMITS.BIO_MAX}</p>
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border-2 border-primary text-primary py-2 font-medium">
            キャンセル
          </button>
          <button type="button" onClick={onSave} className="flex-1 rounded-full bg-primary text-primary-foreground py-2 font-medium">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
