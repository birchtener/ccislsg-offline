"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EventsTable } from "./events-table";
import { EventDrawer } from "./event-drawer";
import { DeleteEvent } from "../actions/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search } from "lucide-react";

interface EventsClientProps {
  initialData: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function EventsClient({
  initialData,
  canCreate,
  canUpdate,
  canDelete,
}: EventsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);

  const filteredEvents = useMemo(() => {
    return initialData.filter((event) => {
      const search = searchValue.toLowerCase().trim();
      return search === "" || event.name.toLowerCase().includes(search);
    });
  }, [initialData, searchValue]);

  const handleAddClick = () => {
    setEventToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (event: any) => {
    setEventToEdit(event);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (event: any) => {
    setEventToDelete(event);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    const id = eventToDelete.id;

    startTransition(async () => {
      const toastId = toast.loading("Deleting event and associated logs...");
      try {
        const result = await DeleteEvent(id);

        if (!result.ok) {
          toast.error(result.error || "Failed to delete event.", { id: toastId });
          return;
        }

        toast.success(result.message || "Event deleted successfully.", { id: toastId });
        setIsDeleteOpen(false);
        setEventToDelete(null);
        router.refresh();
      } catch (err) {
        toast.error("An unexpected error occurred.", { id: toastId });
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full flex justify-between mt-8 md:flex-row flex-col gap-4">
        <div className="relative md:w-100 h-13.5 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name"
            className="pr-8"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button onClick={handleAddClick} className="h-13.5 px-4!">
              <Plus className="size-4" />
              Create Event
            </Button>
          </div>
        )}
      </div>

      <EventsTable
        data={filteredEvents}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <EventDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        eventToEdit={eventToEdit}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the event{" "}
              <strong className="text-foreground">"{eventToDelete?.name}"</strong>?
              This will permanently delete all associated student attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
              className="h-10 cursor-pointer"
            >
              {isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
