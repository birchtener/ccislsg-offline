"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UsersToolbar } from "./users-toolbar";
import { UsersTable } from "./users-table";
import { UserDrawer } from "./user-drawer";
import { PasswordCopyDialog } from "./password-copy-dialog";
import { DeleteUser, ResetPassword } from "../actions/users";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface UsersClientProps {
  initialData: any[];
  roles: Array<{ id: string; name: string }>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string;
}

export function UsersClient({
  initialData,
  roles,
  canCreate,
  canUpdate,
  canDelete,
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordUsername, setPasswordUsername] = useState("");
  const [passwordDialogTitle, setPasswordDialogTitle] = useState("");

  const filteredUsers = useMemo(() => {
    return initialData.filter((user) => {
      const search = searchValue.toLowerCase().trim();
      return (
        search === "" ||
        user.name.toLowerCase().includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    });
  }, [initialData, searchValue]);

  const handleAddClick = () => {
    setUserToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    setIsDrawerOpen(true);
  };

  const handleDeleteTrigger = (id: string) => {
    setUserToDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDeleteId) return;

    const id = userToDeleteId;
    setIsDeleteOpen(false);
    setUserToDeleteId(null);

    const toastId = toast.loading("Deleting user account...");

    try {
      const result = await DeleteUser(id);

      if (!result.ok) {
        toast.error(result.error || "Failed to delete user.", { id: toastId });
        return;
      }

      toast.success(result.message || "User deleted successfully", { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.", { id: toastId });
    }
  };

  const handleResetPasswordTrigger = async (user: any) => {
    const toastId = toast.loading("Generating new password...");

    try {
      const result = await ResetPassword(user.id);

      if (!result.ok) {
        toast.error(result.error || "Failed to reset password.", { id: toastId });
        return;
      }

      toast.success(result.message || "Password reset successfully", { id: toastId });
      setGeneratedPassword(result.password!);
      setPasswordUsername(user.username);
      setPasswordDialogTitle("Password Reset");
      setIsPasswordDialogOpen(true);
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.", { id: toastId });
    }
  };

  const handleDrawerSuccess = (password?: string, username?: string) => {
    router.refresh();
    if (password && username) {
      setGeneratedPassword(password);
      setPasswordUsername(username);
      setPasswordDialogTitle("User Account Created");
      setIsPasswordDialogOpen(true);
    }
  };

  return (
    <div className="w-full space-y-4">
      <UsersToolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        canCreate={canCreate}
        onAddClick={handleAddClick}
      />

      <UsersTable
        data={filteredUsers}
        onEdit={handleEditClick}
        onDelete={handleDeleteTrigger}
        onResetPassword={handleResetPasswordTrigger}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentUserId={currentUserId}
      />

      <UserDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        userToEdit={userToEdit}
        roles={roles}
        onSuccess={handleDrawerSuccess}
      />

      <PasswordCopyDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        password={generatedPassword}
        username={passwordUsername}
        title={passwordDialogTitle}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This will permanently delete their account and revoke their access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
