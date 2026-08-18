'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeModal({ open, onOpenChange }: ComposeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compose New Email</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">Compose flow coming soon.</p>
      </DialogContent>
    </Dialog>
  );
}
