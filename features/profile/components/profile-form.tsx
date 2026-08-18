"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileSchema, ProfileInput } from "../schema/profile";
import { authClient, Session } from "@/features/auth/lib/auth-client";
import { toast } from "sonner";
import { handleUpload } from "@/lib/cloudinary";
import { deleteImage } from "@/actions/cloudinary";
import { updateProfile } from "../actions/profile";
import ProfilePhoto from "./profile-photo";
import ProfileInfo from "./profile-info";
import ChangePassword from "./change-password";
import ActionBar from "./action-bar";

export default function ProfileForm({ user }: { user: Session["user"] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const {
    control,
    setValue,
    reset,
    handleSubmit,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      username: user?.username ?? "",
      password: "",
      newPassword: "",
      confirmPassword: "",
      avatarFile: null,
      removeAvatar: false,
    },
  });

  const isMarkedForRemoval = useWatch({ control, name: "removeAvatar" });
  const hasPhoto = Boolean(preview || (user?.image && !isMarkedForRemoval));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be below 5MB");
      return;
    }

    setValue("avatarFile", file, { shouldDirty: true, shouldValidate: true });

    if (preview) URL.revokeObjectURL(preview);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
      setValue("avatarFile", null, { shouldDirty: true, shouldValidate: true });
      if (fileRef.current) fileRef.current.value = "";
    }

    if (user?.image) {
      setValue("removeAvatar", true, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const displaySrc = preview
    ? preview
    : isMarkedForRemoval
      ? undefined
      : user?.image || undefined;

  async function onSubmit(data: ProfileInput) {
    try {
      let uploadedImageUrl = user?.image;

      if (data.avatarFile) {
        const res = await handleUpload(data.avatarFile, "profile");
        const uploadResult = res[0];

        if (!uploadResult?.success) {
          toast.error(uploadResult?.error || "Upload failed");
          return;
        }

        if (user?.image) {
          await deleteImage(user.image);
        }

        uploadedImageUrl = uploadResult.url;
      } else if (data.removeAvatar && user?.image) {
        await deleteImage(user.image);
        uploadedImageUrl = null;
      }

      if (data.newPassword && data.password) {
        const { error: passwordError } = await authClient.changePassword({
          newPassword: data.newPassword,
          currentPassword: data.password,
          revokeOtherSessions: true,
        });

        if (passwordError) {
          setError("password", {
            type: "server",
            message: passwordError.message || "Incorrect current password.",
          });
          toast.error("Failed to change password.");
          return;
        }
      }

      const res = await updateProfile(data, uploadedImageUrl);

      if (!res.ok) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              setError(field as keyof ProfileInput, {
                type: "server",
                message: messages[0],
              });
            }
          });
        } else if (res.error) {
          toast.error(res.error);
        }
        return;
      }

      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);

      reset({
        ...data,
        password: "",
        newPassword: "",
        confirmPassword: "",
        avatarFile: null,
        removeAvatar: false,
      });

      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      router.refresh();
      toast.success("Profile updated successfully!");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[ON_SUBMIT_ERROR]", err);
      }
      toast.error("Failed to update profile.");
    }
  }

  return (
    <div className="w-full space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`w-full flex flex-col gap-6 ${isDirty ? "pb-24" : "pb-8"}`}
      >
        <ProfilePhoto
          user={user}
          role={user!.role}
          fileRef={fileRef}
          handleFileChange={handleFileChange}
          hasPhoto={hasPhoto}
          displaySrc={displaySrc}
          handleRemovePhoto={handleRemovePhoto}
        />
        <ProfileInfo control={control} />
        <ChangePassword
          control={control}
          showPassword={showPassword}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowPassword={setShowPassword}
          setShowNewPassword={setShowNewPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
        <ActionBar
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          preview={preview}
          setPreview={setPreview}
          setShowConfirmPassword={setShowConfirmPassword}
          setShowNewPassword={setShowNewPassword}
          setShowPassword={setShowPassword}
          reset={reset}
        />
      </form>
    </div>
  );
}
