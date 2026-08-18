"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Upload,
  X,
  Crop,
  ImagePlus,
  PackageSearch,
  CalendarIcon,
} from "lucide-react";

import { handleUpload } from "@/lib/cloudinary";
import {
  LostFoundItemSchema,
  LostFoundItemInput,
  LostFoundItemWithImages,
  LostFoundStatus,
} from "../types/lost-found";
import {
  createLostFoundItem,
  updateLostFoundItem,
  CloudinaryUploadedImage,
} from "../actions/lost-found";
import { ImageCropperModal } from "./image-cropper-modal";

interface AddEditLostFoundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: LostFoundItemWithImages | null;
  onSuccess?: () => void;
}

type LocalImageFile = {
  id: string;
  file: File;
  previewUrl: string;
};

export function AddEditLostFoundDrawer({
  isOpen,
  onClose,
  itemToEdit,
  onSuccess,
}: AddEditLostFoundDrawerProps) {
  const isMobile = useIsMobile();
  const isEditing = Boolean(itemToEdit);

  // Existing images kept in edit mode
  const [existingImages, setExistingImages] = useState<
    { id: string; image_url: string; public_id?: string | null }[]
  >([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  // New local files to be uploaded
  const [newImageFiles, setNewImageFiles] = useState<LocalImageFile[]>([]);

  // Cropper modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [activeFileToCrop, setActiveFileToCrop] = useState<{
    id: string;
    file: File;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<LostFoundItemInput>({
    resolver: zodResolver(LostFoundItemSchema),
    defaultValues: {
      title: "",
      location_found: "",
      date_found: new Date(),
      description: "",
      remarks: "",
      status: LostFoundStatus.UNCLAIMED,
    },
  });

  const dateFoundValue = watch("date_found");

  useEffect(() => {
    if (itemToEdit) {
      reset({
        title: itemToEdit.title,
        location_found: itemToEdit.location_found || "",
        date_found: itemToEdit.date_found
          ? new Date(itemToEdit.date_found)
          : new Date(),
        description: itemToEdit.description || "",
        remarks: itemToEdit.remarks || "",
        status: itemToEdit.status || LostFoundStatus.UNCLAIMED,
      });
      setExistingImages(itemToEdit.images || []);
      setRemovedImageIds([]);
      setNewImageFiles([]);
    } else {
      reset({
        title: "",
        location_found: "",
        date_found: new Date(),
        description: "",
        remarks: "",
        status: LostFoundStatus.UNCLAIMED,
      });
      setExistingImages([]);
      setRemovedImageIds([]);
      setNewImageFiles([]);
    }
  }, [itemToEdit, reset, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const added: LocalImageFile[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit.`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      added.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
      });
    });

    setNewImageFiles((prev) => [...prev, ...added]);
    e.target.value = "";
  };

  const handleRemoveNewFile = (id: string) => {
    setNewImageFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRemoveExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setRemovedImageIds((prev) => [...prev, id]);
  };

  const openCropperForFile = (localFile: LocalImageFile) => {
    setActiveFileToCrop({ id: localFile.id, file: localFile.file });
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    if (!activeFileToCrop) return;
    const newPreviewUrl = URL.createObjectURL(croppedFile);

    setNewImageFiles((prev) =>
      prev.map((item) => {
        if (item.id === activeFileToCrop.id) {
          URL.revokeObjectURL(item.previewUrl);
          return {
            ...item,
            file: croppedFile,
            previewUrl: newPreviewUrl,
          };
        }
        return item;
      }),
    );
    setActiveFileToCrop(null);
  };

  const onSubmitForm = async (data: LostFoundItemInput) => {
    try {
      setIsSubmitting(true);

      let uploadedImages: CloudinaryUploadedImage[] = [];

      if (newImageFiles.length > 0) {
        toast.loading("Uploading images to Cloudinary (lost-found)...", {
          id: "uploading",
        });
        const uploadResults = await handleUpload(
          newImageFiles.map((f) => f.file),
          "lost-found",
        );

        toast.dismiss("uploading");

        const failedUploads = uploadResults.filter((res) => !res.success);
        if (failedUploads.length > 0) {
          toast.error("Failed to upload some images. Please try again.");
          setIsSubmitting(false);
          return;
        }

        uploadedImages = uploadResults.map((res: any) => ({
          url: res.url,
          publicId: res.publicId,
        }));
      }

      if (isEditing && itemToEdit) {
        const result = await updateLostFoundItem(itemToEdit.id, {
          title: data.title,
          location_found: data.location_found,
          date_found: data.date_found,
          description: data.description,
          remarks: data.remarks,
          images: uploadedImages,
          removedImageIds,
        });

        if (!result.ok) {
          toast.error(result.error || "Failed to update item");
          return;
        }

        toast.success("Lost item updated successfully!");
      } else {
        const result = await createLostFoundItem({
          title: data.title,
          location_found: data.location_found,
          date_found: data.date_found,
          description: data.description,
          images: uploadedImages,
        });

        if (!result.ok) {
          toast.error(result.error || "Failed to create item");
          return;
        }

        toast.success("Lost item reported successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
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
            <DrawerTitle className="text-lg font-bold flex items-center gap-2">
              <PackageSearch className="size-5 text-primary" />
              {isEditing ? "Edit Lost & Found Item" : "Add Lost & Found Item"}
            </DrawerTitle>
            <DrawerDescription className="text-xs pb-2">
              {isEditing
                ? "Update item information, location, or images."
                : "Log a newly found physical item in the system."}
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
            <form
              onSubmit={handleSubmit(onSubmitForm)}
              className="px-6 space-y-4 text-left"
              data-base-ui-swipe-ignore
            >
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="font-semibold">
                  Item Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Black Leather Wallet, iPhone 14 Pro"
                  className="h-13.5 px-4 text-sm"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Location Found & Date Found Grid */}
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location_found" className="font-semibold">
                    Location Found <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location_found"
                    placeholder="e.g. Room 104, Library"
                    className="h-13.5 px-4 text-sm"
                    {...register("location_found")}
                  />
                  {errors.location_found && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.location_found.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date_found" className="font-semibold">
                    Date Found
                  </Label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-13.5 px-4 justify-start text-left font-normal text-sm bg-background border-input shadow-xs",
                            !dateFoundValue && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                          {dateFoundValue ? (
                            format(new Date(dateFoundValue), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          dateFoundValue ? new Date(dateFoundValue) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setValue("date_found", date);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="font-semibold">
                  Description & Distinguishing Features
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide details (color, brand, contents, condition, initial owner initials)..."
                  rows={3}
                  className="resize-none px-3"
                  {...register("description")}
                />
              </div>

              {/* Remarks (Edit mode) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="remarks" className="font-semibold">
                    Internal Remarks / Status Notes
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder="Notes regarding custody or claim history..."
                    rows={2}
                    className="resize-none px-3"
                    {...register("remarks")}
                  />
                </div>
              )}

              {/* Images Upload Section */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-primary" />
                    Item Photos
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    (16:9 ratio recommended)
                  </span>
                </div>

                {/* Upload Input Button */}
                <label
                  htmlFor="file-upload-input"
                  className="flex items-center justify-center gap-2.5 h-13.5 px-4 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 text-sm font-semibold text-foreground shadow-xs"
                >
                  <Upload className="w-4.5 h-4.5 text-primary" />
                  Upload New Image(s)
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>

                {/* Photos Previews List */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {/* Existing Images */}
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video rounded-lg overflow-hidden border border-border group bg-black/80"
                    >
                      <img
                        src={img.image_url}
                        alt="Existing item photo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive/90 text-destructive-foreground rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded">
                        Saved
                      </span>
                    </div>
                  ))}

                  {/* New Image Files */}
                  {newImageFiles.map((local) => (
                    <div
                      key={local.id}
                      className="relative aspect-video rounded-lg overflow-hidden border border-primary/50 group bg-black/80"
                    >
                      <img
                        src={local.previewUrl}
                        alt="New item photo preview"
                        className="w-full h-full object-cover"
                      />

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => openCropperForFile(local)}
                        >
                          <Crop className="w-3 h-3" /> Adjust
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(local.id)}
                          className="p-1 bg-destructive text-destructive-foreground rounded-full"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="absolute bottom-1 left-1 bg-primary text-[10px] text-primary-foreground px-1.5 py-0.5 rounded">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </ScrollArea>

          <DrawerFooter className="border-t mt-auto shrink-0 flex flex-row gap-2 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-13.5 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmitForm)}
              disabled={isSubmitting}
              className="flex-1 h-13.5 px-4 text-sm font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Item
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Image Cropper Modal */}
      {activeFileToCrop && (
        <ImageCropperModal
          isOpen={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setActiveFileToCrop(null);
          }}
          imageFile={activeFileToCrop.file}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}
    </>
  );
}
