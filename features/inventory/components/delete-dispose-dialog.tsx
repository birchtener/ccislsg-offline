"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Archive, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { DisposeInventoryItem, DeleteInventoryItem } from "../actions/inventory";
import { toast } from "sonner";

interface DeleteDisposeDialogProps {
  item: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteDisposeDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: DeleteDisposeDialogProps) {
  const [mode, setMode] = useState<"choose" | "dispose" | "hard_delete">("choose");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleClose = () => {
    onOpenChange(false);
    setMode("choose");
    setReason("");
  };

  const handleDispose = async () => {
    setLoading(true);
    try {
      const res = await DisposeInventoryItem({
        itemId: item.id,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error || "Failed to dispose item.");
        return;
      }
      toast.success(`Item "${item.name}" moved to Disposed.`);
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async () => {
    setLoading(true);
    try {
      const res = await DeleteInventoryItem(item.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to permanently delete item.");
        return;
      }
      toast.success(`Item "${item.name}" permanently deleted.`);
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {mode === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="size-5 text-amber-500" />
                Remove or Dispose Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                How would you like to handle <strong>&quot;{item.name}&quot;</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <button
                type="button"
                onClick={() => setMode("dispose")}
                className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 shrink-0">
                  <Archive className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground">
                    Dispose / Write Off (Recommended)
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Moves the item to the <strong>Disposed</strong> tab. Retains borrow logs, history, and custody records for audits.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("hard_delete")}
                className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-destructive/5 hover:border-destructive/40 transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive/20 shrink-0">
                  <Trash2 className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-destructive">
                    Permanent Hard Delete
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Completely and permanently deletes the item and all associated individual assets. Cannot be undone.
                  </p>
                </div>
              </button>
            </div>

            <div className="border-t pt-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full h-11 text-sm font-semibold"
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {mode === "dispose" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Archive className="size-5 text-amber-500" />
                Dispose Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Provide an optional reason for disposing <strong>&quot;{item.name}&quot;</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="disposal_reason">Reason for Disposal (Optional)</Label>
                <Textarea
                  id="disposal_reason"
                  placeholder="e.g. Broken beyond repair, Obsolete, Donated, Disposed during yearly audit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="resize-none h-24 text-sm"
                />
              </div>
            </div>

            <div className="border-t pt-3 mt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={loading}
                className="flex-1 h-11 text-sm"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleDispose}
                disabled={loading}
                className="flex-1 h-11 text-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Confirm Disposal
              </Button>
            </div>
          </>
        )}

        {mode === "hard_delete" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-destructive">
                <Trash2 className="size-5 text-destructive" />
                Permanently Delete Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Are you sure you want to permanently delete <strong>&quot;{item.name}&quot;</strong>? This action is irreversible.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-xs leading-relaxed border border-destructive/20 my-2 text-left">
              <strong>Warning:</strong> All generated individual asset QR codes, tags, and item details will be wiped. If this item has active unreturned borrows, deletion will be blocked.
            </div>

            <div className="border-t pt-3 mt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={loading}
                className="flex-1 h-11 text-sm"
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleHardDelete}
                disabled={loading}
                className="flex-1 h-11 text-sm font-semibold gap-1.5"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Permanently Delete
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
