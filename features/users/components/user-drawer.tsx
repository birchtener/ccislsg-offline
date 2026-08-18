"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { UserFormSchema, UserFormInput } from "../schema/users";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateUser, UpdateUser } from "../actions/users";
import { toast } from "sonner";

interface UserDrawerProps {
  userToEdit: any | null; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Array<{ id: string; name: string }>;
  onSuccess: (password?: string, username?: string) => void;
}

export function UserDrawer({
  userToEdit,
  open,
  onOpenChange,
  roles,
  onSuccess,
}: UserDrawerProps) {
  const isMobile = useIsMobile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      role_id: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (userToEdit) {
        reset({
          username: userToEdit.username,
          first_name: userToEdit.first_name,
          last_name: userToEdit.last_name,
          role_id: userToEdit.role_id,
        });
      } else {
        reset({
          username: "",
          first_name: "",
          last_name: "",
          role_id: "",
        });
      }
    }
  }, [userToEdit, open, reset]);

  const onSubmit = async (data: UserFormInput) => {
    try {
      if (userToEdit) {
        
        const result = await UpdateUser({
          id: userToEdit.id,
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          role_id: data.role_id,
        });

        if (!result.ok) {
          toast.error(result.error || "Failed to update user.");
          return;
        }

        toast.success(result.message || "User updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        
        const result = await CreateUser({
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          role_id: data.role_id,
        });

        if (!result.ok) {
          toast.error(result.error || "Failed to create user.");
          return;
        }

        toast.success(result.message || "User created successfully");
        onSuccess(result.password, data.username); 
        onOpenChange(false);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{userToEdit ? "Edit User" : "Add User"}</DrawerTitle>
          <DrawerDescription>
            {userToEdit
              ? "Update details for this user account"
              : "Create a new user account. A secure password will be generated automatically."}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea
          className="flex-1 min-h-0 my-2! mb-4!"
          data-base-ui-swipe-ignore
        >
          <form
            id="user-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 py-2 space-y-4"
            data-base-ui-swipe-ignore
          >
            <FieldGroup>
              <Field>
                <FieldLabel className="text-sm font-medium">
                  Username
                </FieldLabel>
                <Controller
                  control={control}
                  name="username"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="johndoe"
                      className="text-base md:text-sm"
                    />
                  )}
                />
                {errors.username && (
                  <FieldError>{errors.username.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">
                  First Name
                </FieldLabel>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="John"
                      className="text-base md:text-sm"
                    />
                  )}
                />
                {errors.first_name && (
                  <FieldError>{errors.first_name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">
                  Last Name
                </FieldLabel>
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Doe"
                      className="text-base md:text-sm"
                    />
                  )}
                />
                {errors.last_name && (
                  <FieldError>{errors.last_name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">Role</FieldLabel>
                <Controller
                  control={control}
                  name="role_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-13.5! text-base md:text-sm">
                        <SelectValue placeholder="Select Role">
                          {(value) => {
                            const role = roles.find((r) => r.id === value);
                            return role ? role.name : undefined;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem
                            className="h-13.5!"
                            key={role.id}
                            value={role.id}
                          >
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role_id && (
                  <FieldError>{errors.role_id.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4">
          <Button
            type="submit"
            form="user-form"
            disabled={isSubmitting}
            className="w-full h-11 text-base md:text-sm"
          >
            {isSubmitting
              ? "Saving..."
              : userToEdit
                ? "Save Changes"
                : "Create User"}
          </Button>
          <DrawerClose
            render={
              <Button
                variant="outline"
                className="w-full h-11 text-base md:text-sm"
              >
                Cancel
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
