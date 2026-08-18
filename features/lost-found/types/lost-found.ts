import { z } from "zod";

export enum LostFoundStatus {
  UNCLAIMED = "UNCLAIMED",
  CLAIMED = "CLAIMED",
}

export const LostFoundItemSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title is too long"),
  description: z.string().optional(),
  location_found: z.string().min(2, "Location found is required"),
  date_found: z.date().optional(),
  status: z.nativeEnum(LostFoundStatus).optional(),
  claimed_by: z.string().optional(),
  claimed_at: z.string().or(z.date()).optional(),
  remarks: z.string().optional(),
});

export type LostFoundItemInput = z.infer<typeof LostFoundItemSchema>;

export type LostFoundImageItem = {
  id: string;
  item_id: string;
  image_url: string;
  public_id: string | null;
  order: number;
  created_at: Date;
};

export type LostFoundItemWithImages = {
  id: string;
  title: string;
  description: string | null;
  location_found: string | null;
  date_found: Date;
  status: LostFoundStatus;
  claimed_by: string | null;
  claimed_at: Date | null;
  remarks: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  created_user?: {
    id: string;
    name: string;
    image: string | null;
  };
  images: LostFoundImageItem[];
};
