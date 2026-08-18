"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Session } from "@/features/auth/lib/auth-client";
import { Role } from "@/lib/generated/prisma/client";

interface ProfilePhotoProps {
  user: Session["user"];
  role: Role;
  fileRef: React.MutableRefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasPhoto: boolean;
  displaySrc: string | undefined;
  handleRemovePhoto: () => void;
}

export default function ProfilePhoto({
  user,
  role,
  fileRef,
  handleFileChange,
  hasPhoto,
  displaySrc,
  handleRemovePhoto,
}: ProfilePhotoProps) {
  return (
    <div className="w-full border border-border p-6 bg-card rounded-lg flex flex-col gap-6">
      <div className="w-full space-y-1">
        <div className="flex gap-2 items-center">
          <Camera className="size-6 text-muted-foreground" />
          <h1 className="text-lg font-medium">Profile Picture</h1>
        </div>
        <p className="text-sm text-muted-foreground font-light">
          Upload a new profile picture. Recommended size: 400 by 400 pixels.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        <button
          type="button"
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Change avatar"
          onClick={() => fileRef.current?.click()}
        >
          <Avatar className="size-24 ring-2 ring-border ring-offset-2 ring-offset-background transition-shadow group-hover:ring-primary/50">
            <AvatarImage src={displaySrc} alt="Profile picture" />
            <AvatarFallback className="text-xl font-semibold bg-muted">
              {user.first_name?.charAt(0) + user.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
        </button>
        <div>
          <div className="flex gap-3 items-center">
            <h1 className="text-lg font-semibold">{user.name}</h1>
            <Badge variant="default">{role.name}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <div className="hidden md:flex gap-2 mt-2">
            <Button variant="default" onClick={() => fileRef.current?.click()}>
              {user.image ? "Change Photo" : "Upload Photo"}
            </Button>
            {hasPhoto && (
              <Button variant="destructive" onClick={handleRemovePhoto}>
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="block md:hidden space-y-2 w-full">
        <Button
          variant="default"
          className="w-full py-6"
          onClick={() => fileRef.current?.click()}
        >
          {user.image ? "Change Photo" : "Upload Photo"}
        </Button>
        {hasPhoto && (
          <Button
            className="w-full py-6"
            variant="destructive"
            onClick={handleRemovePhoto}
          >
            Remove Photo
          </Button>
        )}
      </div>
    </div>
  );
}
