"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface ActionBarProps {
  isDirty: boolean;
  isSubmitting: boolean;
  preview?: string | null;
  setPreview: (preview: string | null) => void;
  setShowConfirmPassword: (show: boolean) => void;
  setShowNewPassword: (show: boolean) => void;
  setShowPassword: (show: boolean) => void;
  reset: () => void;
}

export default function ActionBar({
  isDirty,
  isSubmitting,
  preview,
  setPreview,
  setShowConfirmPassword,
  setShowNewPassword,
  setShowPassword,
  reset,
}: ActionBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          role="region"
          aria-label="Unsaved changes"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-md min-w-[320px] max-w-lg"
        >
          <p className="text-sm font-medium text-foreground">
            You have unsaved changes!
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setShowConfirmPassword(false);
                setShowNewPassword(false);
                setShowPassword(false);
                reset();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
