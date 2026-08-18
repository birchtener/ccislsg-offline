"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToDelete: any | null;
  availableRoles: Array<{ id: string; name: string }>;
  onConfirm: (newRoleId: string) => void;
  isDeleting: boolean;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  roleToDelete,
  availableRoles,
  onConfirm,
  isDeleting,
}: DeleteRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedRoleId("");
    }
  }, [open]);

  if (!roleToDelete) return null;

  const userCount = roleToDelete._count?.users ?? 0;
  const hasUsers = userCount > 0;
  const isConfirmDisabled = (hasUsers && !selectedRoleId) || isDeleting;

  const handleConfirm = () => {

    const reassignId = hasUsers ? selectedRoleId : (availableRoles[0]?.id || "");
    onConfirm(reassignId);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Delete Role</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Are you sure you want to delete the role{" "}
              <strong className="text-foreground">"{roleToDelete.name}"</strong>?
              This action cannot be undone.
            </span>

            {hasUsers ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3 mt-2 text-foreground">
                <p className="text-xs font-semibold text-warning-foreground">
                  WARNING: This role is currently assigned to {userCount}{" "}
                  {userCount === 1 ? "user" : "users"}.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Reassign users to:
                  </label>
                  <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || "")}>
                    <SelectTrigger className="w-full h-10 text-base md:text-sm">
                      <SelectValue placeholder="Select Alternate Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                There are currently no users assigned to this role.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="h-10 cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete and Reassign"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
