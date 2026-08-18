import { z } from "zod";
import { Program } from "@/lib/generated/prisma/enums";

export interface FilterItem {
  value: Program | number;
  label: String;
  type: "program" | "year";
}

export const filterItems: FilterItem[] = [
  {
    value: Program.BSCS,
    label: Program.BSCS,
    type: "program",
  },
  {
    value: Program.BSIT,
    label: Program.BSIT,
    type: "program",
  },
  {
    value: Program.BSIS,
    label: Program.BSIS,
    type: "program",
  },
  {
    value: 1,
    label: "1st Year",
    type: "year",
  },
  {
    value: 2,
    label: "2nd Year",
    type: "year",
  },
  {
    value: 3,
    label: "3rd Year",
    type: "year",
  },
  {
    value: 4,
    label: "4th Year",
    type: "year",
  },
  {
    value: 5,
    label: "5th Year",
    type: "year",
  },
];

export const AddStudentSchema = z.object({
  studentNumber: z
    .string()
    .regex(/^\d{3}-\d{5,6}$/, "Student Number must be in format like 221-12345 or 181-123456"),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  program: z.nativeEnum(Program, "Program is required"),
  year: z.number().refine((val) => val >= 1 && val <= 5, {
    message: "Year must be 1-5",
  }),
});

export const ManualImportStudentsSchema = z.object({
  students: z.array(AddStudentSchema).min(1, "Add at least one student"),
});

export type AddStudentInput = z.infer<typeof AddStudentSchema>;
export type ManualImportStudentsInput = z.infer<
  typeof ManualImportStudentsSchema
>;

export const EditStudentSchema = AddStudentSchema.extend({
  id: z.string().uuid(),
});

export type EditStudentInput = z.infer<typeof EditStudentSchema>;

