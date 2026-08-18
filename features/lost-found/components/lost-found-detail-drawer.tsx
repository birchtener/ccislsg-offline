"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Calendar,
  UserCheck,
  Tag,
  Edit,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Loader2,
  PackageSearch,
} from "lucide-react";

import { LostFoundItemWithImages, LostFoundStatus } from "../types/lost-found";
import { updateLostFoundStatus, deleteLostFoundItem } from "../actions/lost-found";
import { LostFoundCarousel } from "./lost-found-carousel";

interface LostFoundDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: LostFoundItemWithImages | null;
  onEdit: (item: LostFoundItemWithImages) => void;
  onRefresh?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function LostFoundDetailDrawer({
  isOpen,
  onClose,
  item,
  onEdit,
  onRefresh,
  canUpdate = true,
  canDelete = true,
}: LostFoundDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimedByName, setClaimedByName] = useState("");
  const [claimRemarks, setClaimRemarks] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const isClaimed = item.status === LostFoundStatus.CLAIMED;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimedByName.trim()) {
      toast.error("Please enter the name of the person claiming the item.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const res = await updateLostFoundStatus(
        item.id,
        LostFoundStatus.CLAIMED,
        claimedByName.trim(),
        claimRemarks.trim()
      );

      if (!res.ok) {
        toast.error(res.error || "Failed to update status");
        return;
      }

      toast.success("Item marked as CLAIMED!");
      setClaimDialogOpen(false);
      setClaimedByName("");
      setClaimRemarks("");
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUnclaim = async () => {
    try {
      setIsUpdatingStatus(true);
      const res = await updateLostFoundStatus(item.id, LostFoundStatus.UNCLAIMED);

      if (!res.ok) {
        toast.error(res.error || "Failed to revert status");
        return;
      }

      toast.success("Item status reverted to UNCLAIMED");
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteLostFoundItem(item.id);

      if (!res.ok) {
        toast.error(res.error || "Failed to delete item");
        return;
      }

      toast.success("Item deleted successfully.");
      onRefresh?.();
      onClose();
    } catch (error) {
      toast.error("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={onClose}
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-lg mx-auto">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={isClaimed ? "default" : "outline"}
                className={
                  isClaimed
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
                }
              >
                {isClaimed ? "CLAIMED" : "UNCLAIMED"}
              </Badge>
            </div>
            <DrawerTitle className="text-lg font-bold flex items-center gap-2">
              <PackageSearch className="size-5 text-primary shrink-0" />
              {item.title}
            </DrawerTitle>
            <DrawerDescription className="text-xs pb-2">
              Viewing registered lost item specifications and claim status history.
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
            <div className="px-6 space-y-5 text-left" data-base-ui-swipe-ignore>
              {/* Carousel display with thumbnail navigation */}
              <LostFoundCarousel images={item.images} title={item.title} />

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-xl border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    <strong className="text-foreground">Found at:</strong>{" "}
                    {item.location_found || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    <strong className="text-foreground">Date Found:</strong>{" "}
                    {item.date_found ? format(new Date(item.date_found), "PPP") : "N/A"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed bg-card p-3 rounded-lg border text-foreground/90 whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Claimed Info Box if Claimed */}
              {isClaimed && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <UserCheck className="w-4.5 h-4.5" /> Claim Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Claimed By:</strong>{" "}
                      {item.claimed_by || "Unknown"}
                    </div>
                    <div>
                      <strong className="text-foreground">Date Claimed:</strong>{" "}
                      {item.claimed_at ? format(new Date(item.claimed_at), "PPP p") : "N/A"}
                    </div>
                  </div>
                  {item.remarks && (
                    <div className="pt-1 text-muted-foreground">
                      <strong className="text-foreground">Remarks:</strong> {item.remarks}
                    </div>
                  )}
                </div>
              )}

              {/* Created User Info */}
              <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t">
                <span>Reported by: {item.created_user?.name || "System Staff"}</span>
                <span>{format(new Date(item.created_at), "PP")}</span>
              </div>
            </div>
          </ScrollArea>

          {/* Actions Footer */}
          <DrawerFooter className="border-t mt-auto shrink-0 flex flex-row gap-2 px-6 py-4 justify-between">
            <div className="flex items-center gap-2">
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isDeleting}
                        className="h-13.5 w-13.5 shrink-0 cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Lost Item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete standard info
                        and Cloudinary photos for <strong>{item.title}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-13.5 px-4 text-sm">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="h-13.5 px-4 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold">
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="h-13.5 w-13.5 shrink-0 cursor-pointer"
                  title="Edit Item"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canUpdate && (
                isClaimed ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={handleUnclaim}
                    className="h-13.5 px-4 text-sm gap-1.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" /> Mark Unclaimed
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => setClaimDialogOpen(true)}
                    className="h-13.5 px-4 text-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Claimed
                  </Button>
                )
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Mark Item as Claimed
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleClaimSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="claimed_by">
                Claimer's Full Name / Student ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="claimed_by"
                placeholder="e.g. John Doe (2024-12345)"
                value={claimedByName}
                onChange={(e) => setClaimedByName(e.target.value)}
                className="h-13.5 px-4 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="claim_remarks">Claim Remarks / Identification Proof</Label>
              <Textarea
                id="claim_remarks"
                placeholder="e.g. Verified via Student ID and wallpaper photo match."
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                rows={2}
                className="resize-none px-3"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setClaimDialogOpen(false)}
                className="h-13.5 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingStatus}
                className="h-13.5 px-4 text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm Claim"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
