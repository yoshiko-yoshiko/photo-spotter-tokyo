import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ja });
}
