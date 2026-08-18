"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CreateInventoryCategory,
  UpdateInventoryCategory,
} from "../actions/inventory";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddEditCategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: any | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddEditCategoryDrawer({
  open,
  onOpenChange,
  categoryToEdit = null,
  onSuccess,
}: AddEditCategoryDrawerProps) {
  const isMobile = useIsMobile();
  const isEdit = Boolean(categoryToEdit);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (categoryToEdit) {
      reset({
        name: categoryToEdit.name || "",
        description: categoryToEdit.description || "",
      });
    } else {
      reset({
        name: "",
        description: "",
      });
    }
  }, [open, categoryToEdit, reset]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isEdit && categoryToEdit) {
        const res = await UpdateInventoryCategory({
          id: categoryToEdit.id,
          name: values.name,
          description: values.description,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to update category.");
          return;
        }

        toast.success(`Category "${values.name}" updated successfully.`);
      } else {
        const res = await CreateInventoryCategory({
          name: values.name,
          description: values.description,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to create category.");
          return;
        }

        toast.success(`Category "${values.name}" created successfully.`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-lg mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-lg font-bold flex items-center gap-2">
            {isEdit ? (
              <>
                <Edit className="size-5 text-primary" />
                Edit Item Category
              </>
            ) : (
              <>
                <Plus className="size-5 text-primary" />
                Add Item Category
              </>
            )}
          </DrawerTitle>
          <DrawerDescription className="text-xs pb-2">
            {isEdit
              ? "Update category name or notes."
              : "Create a reusable category (e.g. Office, Sports, Medicine, IT) used across all item types."}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 space-y-4 text-left"
            data-base-ui-swipe-ignore
          >
            {/* Category Name */}
            <div className="space-y-1.5">
              <Label htmlFor="category_name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category_name"
                placeholder="e.g. Office, Medicine & Health, Sports, IT & Multimedia"
                className="h-13.5 px-4 text-sm"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs font-semibold text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief summary of items classified under this category"
                className="resize-none h-24 px-4 py-2 text-sm"
                {...register("description")}
              />
            </div>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t mt-auto shrink-0 flex flex-row gap-2 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 h-13.5 px-4 text-sm font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex-1 h-13.5 px-4 text-sm font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Category" : "Save Category"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
