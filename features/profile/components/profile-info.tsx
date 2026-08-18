"use client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserPen } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { ProfileInput } from "../schema/profile";

export default function ProfileInfo({
  control,
}: {
  control: Control<ProfileInput>;
}) {
  return (
    <div className="w-full border border-border p-6 bg-card rounded-lg space-y-6">
      <div className="w-full space-y-1">
        <div className="flex gap-2 items-center">
          <UserPen className="size-6 text-muted-foreground" />
          <h1 className="text-lg font-medium">Profile Information</h1>
        </div>
        <p className="text-sm text-muted-foreground font-light">
          Update your profile information.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldGroup>
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input
                  {...field}
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="John"
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <FieldGroup>
          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input
                  {...field}
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="Doe"
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <FieldGroup>
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  {...field}
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="john.doe"
                  required
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </div>
  );
}
