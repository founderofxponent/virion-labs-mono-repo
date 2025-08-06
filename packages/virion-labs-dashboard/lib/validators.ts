import { z } from 'zod';

export const addClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().min(1, "Industry is required"),
  website: z.string().url().optional().or(z.literal('')),
  primary_contact: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  influencers: z.number().optional(),
});

export type AddClientData = z.infer<typeof addClientSchema>;