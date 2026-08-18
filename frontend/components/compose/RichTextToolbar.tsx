import {
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignJustify,
  ListOrdered,
  List,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Strikethrough,
} from 'lucide-react';

function exec(command: string) {
  document.execCommand(command);
}

function ToolbarButton({
  icon: Icon,
  onClick,
  label,
}: {
  icon: typeof Bold;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100"
    >
      <Icon size={15} />
    </button>
  );
}

export function RichTextToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-white px-2 py-1.5">
      <ToolbarButton icon={Undo2} label="Undo" onClick={() => exec('undo')} />
      <ToolbarButton icon={Redo2} label="Redo" onClick={() => exec('redo')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        className="flex items-center gap-0.5 rounded p-1.5 text-gray-500 transition hover:bg-gray-100"
      >
        <Type size={15} />
      </button>
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={Bold} label="Bold" onClick={() => exec('bold')} />
      <ToolbarButton icon={Italic} label="Italic" onClick={() => exec('italic')} />
      <ToolbarButton icon={Underline} label="Underline" onClick={() => exec('underline')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={AlignLeft} label="Align left" onClick={() => exec('justifyLeft')} />
      <ToolbarButton icon={AlignJustify} label="Justify" onClick={() => exec('justifyFull')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={ListOrdered} label="Ordered list" onClick={() => exec('insertOrderedList')} />
      <ToolbarButton icon={List} label="Bullet list" onClick={() => exec('insertUnorderedList')} />
      <ToolbarButton icon={IndentIncrease} label="Indent" onClick={() => exec('indent')} />
      <ToolbarButton icon={IndentDecrease} label="Outdent" onClick={() => exec('outdent')} />
      <ToolbarButton icon={Quote} label="Quote" onClick={() => exec('formatBlock')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
    </div>
  );
}
