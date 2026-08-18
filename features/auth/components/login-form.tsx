"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/ccislsg_logo.png";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/features/auth/schemas/login";
import { authClient } from "@/features/auth/lib/auth-client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  async function onSubmit(data: LoginInput) {
    const { error: signInError } = await authClient.signIn.username({
      username: data.username,
      password: data.password,
    });

    if (signInError && signInError.message) {
      toast.error(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 w-100 bg-card p-8 rounded-xl border-border border relative z-1 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onSubmit)} id="form-login">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-20 items-center justify-center rounded-md">
                <Image src={logo} alt="CCISLSG Logo" />
              </div>
              <span className="sr-only">CCISLSG Hub</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to CCISLSG Hub</h1>
            <FieldDescription>Please enter your credentials</FieldDescription>
          </div>
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-login-username">Username</FieldLabel>
                <Input
                  id="form-login-username"
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="username"
                  required
                  {...field}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-login-password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="form-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
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

          <Field>
            <Button
              type="submit"
              size="lg"
              className="py-6 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  Logging In
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
