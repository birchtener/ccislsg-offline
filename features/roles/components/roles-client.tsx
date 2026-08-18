"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolesTable } from "./roles-table";
import { RoleDrawer } from "./role-drawer";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { DeleteRole } from "../actions/roles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface RolesClientProps {
  initialData: any[];
  permissionCategories: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function RolesClient({
  initialData,
  permissionCategories,
  canCreate,
  canUpdate,
  canDelete,
}: RolesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<any | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);

  const filteredRoles = useMemo(() => {
    return initialData.filter((role) => {
      const search = searchValue.toLowerCase().trim();
      return search === "" || role.name.toLowerCase().includes(search);
    });
  }, [initialData, searchValue]);

  const availableRoles = useMemo(() => {
    if (!roleToDelete) return [];
    return initialData.filter((role) => role.id !== roleToDelete.id);
  }, [initialData, roleToDelete]);

  const handleAddClick = () => {
    setRoleToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (role: any) => {
    setRoleToEdit(role);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (role: any) => {
    setRoleToDelete(role);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async (newRoleId: string) => {
    if (!roleToDelete) return;

    const id = roleToDelete.id;

    startTransition(async () => {
      const toastId = toast.loading("Deleting role and reassigning users...");
      try {
        const result = await DeleteRole(id, newRoleId);

        if (!result.ok) {
          toast.error(result.error || "Failed to delete role.", {
            id: toastId,
          });
          return;
        }

        toast.success(result.message || "Role deleted successfully.", {
          id: toastId,
        });
        setIsDeleteOpen(false);
        setRoleToDelete(null);
        router.refresh();
      } catch (err) {
        toast.error("An unexpected error occurred.", { id: toastId });
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      
      <div className="flex flex-col mt-8 sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pr-9 text-base md:text-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        {canCreate && (
          <Button onClick={handleAddClick} className="h-13.5 px-4!">
            <Plus className="size-4" />
            Add Role
          </Button>
        )}
      </div>

      <RolesTable
        data={filteredRoles}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <RoleDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        roleToEdit={roleToEdit}
        permissionCategories={permissionCategories}
        onSuccess={() => router.refresh()}
      />

      <DeleteRoleDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        roleToDelete={roleToDelete}
        availableRoles={availableRoles}
        onConfirm={confirmDelete}
        isDeleting={isPending}
      />
    </div>
  );
}
