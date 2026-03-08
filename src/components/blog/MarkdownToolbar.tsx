import { Button } from '@/components/ui/button';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code, Link2, Image, Minus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onChange: (value: string) => void;
}

type FormatAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
};

const ACTIONS: FormatAction[] = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: Heading2, label: 'H2', prefix: '## ', block: true },
  { icon: Heading3, label: 'H3', prefix: '### ', block: true },
  { icon: List, label: 'Bullet', prefix: '- ', block: true },
  { icon: ListOrdered, label: 'Number', prefix: '1. ', block: true },
  { icon: Quote, label: 'Quote', prefix: '> ', block: true },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
  { icon: Link2, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: Image, label: 'Image', prefix: '![alt](', suffix: ')' },
  { icon: Minus, label: 'Divider', prefix: '\n---\n', block: true },
];

export function MarkdownToolbar({ textareaRef, content, onChange }: MarkdownToolbarProps) {
  const applyFormat = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    let insert: string;
    let cursorOffset: number;

    if (action.block) {
      // Block-level: insert at line start
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const before = content.slice(0, lineStart);
      const after = content.slice(lineStart);
      insert = action.prefix;
      onChange(before + insert + after);
      cursorOffset = lineStart + insert.length;
    } else {
      const before = content.slice(0, start);
      const after = content.slice(end);
      const suffix = action.suffix || '';
      insert = action.prefix + (selected || action.label) + suffix;
      onChange(before + insert + after);
      cursorOffset = start + action.prefix.length + (selected || action.label).length;
    }

    // Restore focus and cursor
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    });
  };

  return (
    <div className="border border-border rounded-t-md bg-secondary/50 -mb-px relative z-10">
      <div className="flex overflow-x-auto scrollbar-hide gap-0.5 p-1">
        {ACTIONS.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => applyFormat(action)}
            title={action.label}
          >
            <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}
