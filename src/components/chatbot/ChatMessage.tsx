import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Msg } from './types';
import { cn } from '@/lib/utils';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage({ msg }: { msg: Msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          {!isUser ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ul]:mb-0 [&>ol]:mt-1 [&>ol]:mb-0 [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            msg.content
          )}

          {/* Copy button for assistant messages */}
          {!isUser && msg.id !== 'welcome' && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card border rounded-full p-1 shadow-sm hover:bg-muted"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        <span className={cn('text-[10px] text-muted-foreground/60 px-1', isUser && 'text-right')}>
          {formatTime(msg.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}
