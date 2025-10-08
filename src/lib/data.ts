import { z } from 'zod';
import { collection } from '@github/spark/db';

export const activity = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  time: z.string(), // Format: "HH:MM"
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const activityCollection = collection(activity, 'activities');