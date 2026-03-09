import { Trash2 } from 'lucide-react';

interface DeletePhotoDialogProps {
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePhotoDialog({ isPending, onConfirm, onCancel }: DeletePhotoDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-xs animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold text-foreground">写真を削除</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          この写真を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-full bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            {isPending ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}
