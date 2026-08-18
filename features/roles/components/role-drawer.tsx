"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleFormSchema, RoleFormInput } from "../schema/roles";
import { CreateRole, UpdateRole } from "../actions/roles";
import { toast } from "sonner";

interface RoleDrawerProps {
  roleToEdit: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    permissions: Array<{ id: string; name: string }>;
  }>;
  onSuccess: () => void;
}

export function RoleDrawer({
  roleToEdit,
  open,
  onOpenChange,
  permissionCategories,
  onSuccess,
}: RoleDrawerProps) {
  const isMobile = useIsMobile();
  const [checkedPermissionIds, setCheckedPermissionIds] = React.useState<
    Set<string>
  >(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormInput>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: {
      name: "",
      permissionIds: [],
    },
  });

  const allPermissionIds = React.useMemo(() => {
    return permissionCategories.flatMap((cat) =>
      cat.permissions.map((p) => p.id),
    );
  }, [permissionCategories]);

  React.useEffect(() => {
    if (open) {
      if (roleToEdit) {
        const pids = new Set<string>(
          roleToEdit.role_permissions.map((rp: any) => rp.permission_id),
        );
        setCheckedPermissionIds(pids);
        reset({
          name: roleToEdit.name,
          permissionIds: Array.from(pids),
        });
      } else {
        setCheckedPermissionIds(new Set());
        reset({
          name: "",
          permissionIds: [],
        });
      }
    }
  }, [roleToEdit, open, reset]);

  const isAllChecked =
    allPermissionIds.length > 0 &&
    checkedPermissionIds.size === allPermissionIds.length;

  const handleAdminToggle = (checked: boolean) => {
    if (checked) {
      setCheckedPermissionIds(new Set(allPermissionIds));
    } else {
      setCheckedPermissionIds(new Set());
    }
  };

  const onSubmit = async (data: RoleFormInput) => {
    const payload: RoleFormInput = {
      name: data.name,
      permissionIds: Array.from(checkedPermissionIds),
    };

    const toastId = toast.loading(
      roleToEdit ? "Updating role details..." : "Creating new system role...",
    );

    try {
      let result;
      if (roleToEdit) {
        result = await UpdateRole(roleToEdit.id, payload);
      } else {
        result = await CreateRole(payload);
      }

      if (!result.ok) {
        toast.error(result.error || "Operation failed.", { id: toastId });
        return;
      }

      toast.success(result.message || "Operation successful.", { id: toastId });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.", {
        id: toastId,
      });
    }
  };

  const isRoleAdmin = roleToEdit?.name?.toLowerCase() === "admin";

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[90dvh] md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{roleToEdit ? "Edit Role" : "Add Role"}</DrawerTitle>
          <DrawerDescription>
            {roleToEdit
              ? "Update role name and its system permissions"
              : "Create a new role and choose associated permissions"}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea
          className="flex-1 min-h-0 my-2! mb-4!"
          data-base-ui-swipe-ignore
        >
          <form
            id="role-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 py-2 space-y-6"
            data-base-ui-swipe-ignore
          >
            <FieldGroup>
              <Field>
                <FieldLabel className="text-sm font-semibold">
                  Role Name
                </FieldLabel>
                <Input
                  {...register("name")}
                  placeholder="e.g. Moderator"
                  className="text-base md:text-sm"
                  disabled={isRoleAdmin}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>
            </FieldGroup>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground pb-1 border-b">
                Permissions Checklist
              </h4>

              <div className="space-y-4">
                {permissionCategories.map((category) => {
                  const categoryPermissionIds = category.permissions.map(
                    (p) => p.id,
                  );
                  const checkedInCategory = categoryPermissionIds.filter((id) =>
                    checkedPermissionIds.has(id),
                  );
                  const isCategoryChecked =
                    categoryPermissionIds.length > 0 &&
                    checkedInCategory.length === categoryPermissionIds.length;

                  const handleCategoryToggle = (checked: boolean) => {
                    const next = new Set(checkedPermissionIds);
                    if (checked) {
                      categoryPermissionIds.forEach((id) => next.add(id));
                    } else {
                      categoryPermissionIds.forEach((id) => next.delete(id));
                    }
                    setCheckedPermissionIds(next);
                  };

                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border border-border p-4 bg-card/40 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="space-y-0.5">
                          <h5 className="font-semibold text-sm text-foreground">
                            {category.name}
                          </h5>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={isCategoryChecked}
                          onCheckedChange={handleCategoryToggle}
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        {category.permissions.map((permission) => {
                          const isChecked = checkedPermissionIds.has(
                            permission.id,
                          );
                          const handlePermissionToggle = (checked: boolean) => {
                            const next = new Set(checkedPermissionIds);
                            if (checked) {
                              next.add(permission.id);
                            } else {
                              next.delete(permission.id);
                            }
                            setCheckedPermissionIds(next);
                          };

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40 transition-colors border border-transparent hover:border-border"
                            >
                              <span className="text-xs font-semibold text-muted-foreground">
                                {permission.name}
                              </span>
                              <Switch
                                checked={isChecked}
                                onCheckedChange={handlePermissionToggle}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-sm text-primary">
                    Administrator Privileges
                  </h5>
                  <p className="text-xs text-primary/80">
                    Grand full master access. Automatically enables all
                    categories.
                  </p>
                </div>
                <Switch
                  checked={isAllChecked}
                  onCheckedChange={handleAdminToggle}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4">
          <Button
            type="submit"
            form="role-form"
            className="w-full h-10 cursor-pointer"
            disabled={isSubmitting}
          >
            {roleToEdit ? "Save Changes" : "Create Role"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
