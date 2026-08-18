'use client';
import { useState, type RefObject } from 'react';
import {
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  ListOrdered,
  List,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Strikethrough,
} from 'lucide-react';

const MIN_FONT_LEVEL = 1;
const MAX_FONT_LEVEL = 7;

function ensureSelectionInEditor(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  if (selection.rangeCount > 0) {
    const currentRange = selection.getRangeAt(0);
    if (editor.contains(currentRange.commonAncestorContainer)) return;
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
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

export function RichTextToolbar({ editorRef }: { editorRef: RefObject<HTMLDivElement | null> }) {
  const [fontLevel, setFontLevel] = useState(3);
  const [fontDirection, setFontDirection] = useState<1 | -1>(1);

  function exec(command: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    ensureSelectionInEditor(editor);
    document.execCommand(command, false, value);
  }

  function handleFontSizeClick() {
    let next = fontLevel + fontDirection;
    let direction = fontDirection;
    if (next > MAX_FONT_LEVEL) {
      direction = -1;
      next = MAX_FONT_LEVEL - 1;
    } else if (next < MIN_FONT_LEVEL) {
      direction = 1;
      next = MIN_FONT_LEVEL + 1;
    }
    setFontLevel(next);
    setFontDirection(direction);
    exec('fontSize', String(next));
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-white px-2 py-1.5">
      <ToolbarButton icon={Undo2} label="Undo" onClick={() => exec('undo')} />
      <ToolbarButton icon={Redo2} label="Redo" onClick={() => exec('redo')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleFontSizeClick}
        aria-label="Change font size"
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
      <ToolbarButton icon={AlignCenter} label="Align center" onClick={() => exec('justifyCenter')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={ListOrdered} label="Ordered list" onClick={() => exec('insertOrderedList')} />
      <ToolbarButton icon={List} label="Bullet list" onClick={() => exec('insertUnorderedList')} />
      <ToolbarButton icon={IndentIncrease} label="Indent" onClick={() => exec('indent')} />
      <ToolbarButton icon={IndentDecrease} label="Outdent" onClick={() => exec('outdent')} />
      <ToolbarButton icon={Quote} label="Quote" onClick={() => exec('formatBlock', 'blockquote')} />
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
    </div>
  );
}
