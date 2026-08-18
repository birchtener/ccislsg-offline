import { z } from "zod";

const dateSchema = z.union([z.date(), z.string()]);

export const EventFormSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters long")
    .max(100, "Event name must be at most 100 characters long"),
  requires_time_out: z.boolean(),
  isRange: z.boolean(),
  singleDate: dateSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine((data) => {
  if (data.isRange) {
    return !!data.startDate && !!data.endDate;
  } else {
    return !!data.singleDate;
  }
}, {
  message: "Please select the required event date(s).",
  path: ["singleDate"],
});

export type EventFormInput = z.infer<typeof EventFormSchema>;
