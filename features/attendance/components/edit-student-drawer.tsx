"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { EditStudentSchema, EditStudentInput } from "../schema/master-list";
import { Program } from "@/lib/generated/prisma/enums";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpdateStudent } from "../actions/attendance";
import { toast } from "sonner";
import { Student } from "@/lib/generated/prisma/client";

interface EditStudentDrawerProps {
  student: Omit<Student, "created_at"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditStudentDrawer({
  student,
  open,
  onOpenChange,
  onSuccess,
}: EditStudentDrawerProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditStudentInput>({
    resolver: zodResolver(EditStudentSchema),
    defaultValues: {
      id: "",
      studentNumber: "",
      firstName: "",
      lastName: "",
      program: Program.BSCS,
      year: 1,
    },
  });

  React.useEffect(() => {
    if (student) {
      reset({
        id: student.id,
        studentNumber: student.student_id,
        firstName: student.first_name,
        lastName: student.last_name,
        program: student.program as Program,
        year: student.year,
      });
    }
  }, [student, reset]);

  const onSubmit = async (data: EditStudentInput) => {
    try {
      const result = await UpdateStudent(data);

      if (!result.ok) {
        toast.error(result.error || "Failed to update student.");
        return;
      }

      toast.success(result.message || "Student updated successfully");
      onSuccess?.();
      onOpenChange(false);
      router.refresh();
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
          <DrawerTitle>Edit Student</DrawerTitle>
          <DrawerDescription>Update details for this student</DrawerDescription>
        </DrawerHeader>

        <ScrollArea
          className="flex-1 min-h-0 my-2! mb-4!"
          data-base-ui-swipe-ignore
        >
          <form
            id="edit-student-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 py-2 space-y-4"
            data-base-ui-swipe-ignore
          >
            <FieldGroup>
              <Field>
                <FieldLabel className="text-sm font-medium">
                  Student Number
                </FieldLabel>
                <Controller
                  control={control}
                  name="studentNumber"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="22-12345"
                      className="h-10 text-base md:text-sm"
                    />
                  )}
                />
                {errors.studentNumber && (
                  <FieldError>{errors.studentNumber.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">First Name</FieldLabel>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="John"
                      className="h-10 text-base md:text-sm"
                    />
                  )}
                />
                {errors.firstName && (
                  <FieldError>{errors.firstName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">Last Name</FieldLabel>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Doe"
                      className="h-10 text-base md:text-sm"
                    />
                  )}
                />
                {errors.lastName && (
                  <FieldError>{errors.lastName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">Program</FieldLabel>
                <Controller
                  control={control}
                  name="program"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-10 text-base md:text-sm">
                        <SelectValue placeholder="Select Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Program.BSCS}>BSCS</SelectItem>
                        <SelectItem value={Program.BSIT}>BSIT</SelectItem>
                        <SelectItem value={Program.BSIS}>BSIS</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.program && (
                  <FieldError>{errors.program.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">Year</FieldLabel>
                <Controller
                  control={control}
                  name="year"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="h-10 text-base md:text-sm">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.year && (
                  <FieldError>{errors.year.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4">
          <Button
            type="submit"
            form="edit-student-form"
            disabled={isSubmitting}
            className="w-full h-11 text-base md:text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <DrawerClose
            render={
              <Button variant="outline" className="w-full h-11 text-base md:text-sm">
                Cancel
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
