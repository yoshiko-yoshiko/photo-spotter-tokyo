import { LIMITS } from '@/lib/constants';

interface EditNameModalProps {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditNameModal({ name, onNameChange, onSave, onCancel }: EditNameModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slide-up">
        <h3 className="text-lg font-bold text-foreground mb-4">表示名の変更</h3>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={LIMITS.NICKNAME_DISPLAY_MAX}
          className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <p className="text-xs text-muted-foreground text-right mt-1">{name.length}/{LIMITS.NICKNAME_DISPLAY_MAX}</p>
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
