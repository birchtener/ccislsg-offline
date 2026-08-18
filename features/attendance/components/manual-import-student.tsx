"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ManualImportStudentsSchema,
  ManualImportStudentsInput,
} from "../schema/master-list";
import { Program } from "@/lib/generated/prisma/enums";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ManualImportStudents } from "../actions/attendance";
import { toast } from "sonner";

interface ManualImportStudentProps {
  show: boolean;
  setShow: (value: boolean) => void;
  onSubmitSuccess?: (data: ManualImportStudentsInput) => void;
}

const DEFAULT_STUDENT = {
  studentNumber: "",
  firstName: "",
  lastName: "",
  program: Program.BSCS,
  year: 1,
};

export function ManualImportStudent({
  show,
  setShow,
  onSubmitSuccess,
}: ManualImportStudentProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualImportStudentsInput>({
    resolver: zodResolver(ManualImportStudentsSchema),
    defaultValues: {
      students: [DEFAULT_STUDENT],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "students",
  });

  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({
    0: true,
  });

  const toggleCollapsible = (index: number) => {
    setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const onSubmit = async (data: ManualImportStudentsInput) => {
    try {
      const result = await ManualImportStudents(data);

      if (!result.ok) {
        toast.error(result.error || "Failed to import students.");
        return;
      }

      toast.success(result.message || "Students imported successfully");
      onSubmitSuccess?.(data);
      reset({ students: [DEFAULT_STUDENT] });
      setShow(false);
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
      open={show}
      onOpenChange={setShow}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Manual Import Student</DrawerTitle>
          <DrawerDescription>Import student data manually</DrawerDescription>
        </DrawerHeader>

        <ScrollArea
          className="flex-1 min-h-0 my-2! mb-4!"
          data-base-ui-swipe-ignore
        >
          <form
            id="manual-import-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 py-2 space-y-4"
            data-base-ui-swipe-ignore
          >
            {fields.map((fieldItem, index) => {
              const studentError = errors.students?.[index];
              const isOpen = openItems[index] ?? false;

              return (
                <Collapsible
                  key={fieldItem.id}
                  open={isOpen}
                  onOpenChange={() => toggleCollapsible(index)}
                  className="border rounded-lg p-3 bg-card shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="flex items-center gap-2 p-0 hover:bg-transparent! text-sm font-semibold 
                          active:bg-transparent aria-expanded:bg-transparent! aria-expanded:hover:bg-transparent! aria-expanded:focus:bg-transparent!"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                          <span>
                            Student #{index + 1}
                            {fieldItem.firstName
                              ? ` - ${fieldItem.firstName} ${fieldItem.lastName}`
                              : ""}
                          </span>
                        </Button>
                      }
                    ></CollapsibleTrigger>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <CollapsibleContent className="space-y-4 pt-2">
                    <FieldGroup>
                      <Controller
                        name={`students.${index}.studentNumber`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Student Number</FieldLabel>
                            <Input
                              {...field}
                              placeholder="261-12345"
                              type="text"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          name={`students.${index}.firstName`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>First Name</FieldLabel>
                              <Input
                                {...field}
                                placeholder="John"
                                type="text"
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />

                        <Controller
                          name={`students.${index}.lastName`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Last Name</FieldLabel>
                              <Input
                                {...field}
                                placeholder="Doe"
                                type="text"
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          name={`students.${index}.program`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Program</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Program" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(Program).map((prog) => (
                                    <SelectItem key={prog} value={prog}>
                                      {prog}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />

                        <Controller
                          name={`students.${index}.year`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field>
                              <FieldLabel>Year Level</FieldLabel>
                              <Select
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                value={field.value?.toString()}
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4].map((yr) => (
                                    <SelectItem key={yr} value={yr.toString()}>
                                      Year {yr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </div>
                    </FieldGroup>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed gap-2 h-13.5"
              onClick={() => {
                append(DEFAULT_STUDENT);
                setOpenItems((prev) => ({ ...prev, [fields.length]: true }));
              }}
            >
              <Plus className="h-4 w-4" /> Add Another Student
            </Button>
          </form>
        </ScrollArea>
        <DrawerFooter>
          <Button
            type="submit"
            form="manual-import-form"
            disabled={isSubmitting}
            className="py-6"
          >
            {fields.length > 1
              ? `Add ${fields.length} Students`
              : "Add Student"}
          </Button>
          <DrawerClose
            render={
              <Button
                type="button"
                variant="outline"
                className="py-6"
                onClick={() => reset()}
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
