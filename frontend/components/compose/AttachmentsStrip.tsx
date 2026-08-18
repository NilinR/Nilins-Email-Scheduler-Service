import { File, X } from 'lucide-react';

export interface ComposeAttachment {
  file: File;
  previewUrl?: string;
}

export function AttachmentsStrip({
  attachments,
  onRemove,
}: {
  attachments: ComposeAttachment[];
  onRemove: (index: number) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 border-t border-gray-100 p-4">
      {attachments.map((attachment, i) => (
        <div key={i} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-blue-300">
          {attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.previewUrl} alt={attachment.file.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-50 p-1 text-center">
              <File size={20} className="text-gray-400" />
              <span className="w-full truncate text-[10px] text-gray-500">{attachment.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${attachment.file.name}`}
            className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
