import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUp, ChevronUp, Command } from "lucide-react";

export const HelpModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>type@tools help</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>reset test</span>
            <kbd className="px-2 py-1 bg-muted rounded">
              <ArrowUp className="inline mb-0.5" height={16} width={16} /> + esc
            </kbd>
          </div>
          <div className="flex justify-between">
            <span>rotate cursor style</span>
            <kbd className="px-2 py-1 bg-muted rounded">-</kbd>
          </div>
          <div className="flex justify-between">
            <span>help menu (this page)</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-muted rounded">
              <ChevronUp className="inline mb-2" height={16} width={16} /> /{" "}
              <Command className="inline mb-0.5" height={16} width={16} /> + h
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
