"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ShieldUser } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { ProfileInput } from "../schema/profile";

interface ChangePasswordProps {
  control: Control<ProfileInput>;
  showPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
}

export default function ChangePassword({
  control,
  showPassword,
  showNewPassword,
  showConfirmPassword,
  setShowPassword,
  setShowNewPassword,
  setShowConfirmPassword,
}: ChangePasswordProps) {
  return (
    <div className="w-full border border-border p-6 bg-card rounded-lg space-y-6">
      <div className="w-full space-y-1">
        <div className="flex gap-2 items-center">
          <ShieldUser className="size-6 text-muted-foreground" />
          <h1 className="text-lg font-medium">Change Password</h1>
        </div>
        <p className="text-sm text-muted-foreground font-light">
          Update your password.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldGroup className="cols-start-1">
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Current Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="form-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <div className="hidden md:block"></div>
        <FieldGroup className="cols-start-1">
          <Controller
            name="newPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>New Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    type={showNewPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <FieldGroup>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </button>
                </div>
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
