import { QuickReply } from './types';

export default function QuickReplies({
  replies,
  onSelect,
  disabled,
}: {
  replies: QuickReply[];
  onSelect: (msg: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-1">
      {replies.map((r) => (
        <button
          key={r.label}
          onClick={() => onSelect(r.message)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {r.icon && <span>{r.icon}</span>}
          {r.label}
        </button>
      ))}
    </div>
  );
}
