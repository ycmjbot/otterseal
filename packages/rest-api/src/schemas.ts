import { z } from 'zod';

/**
 * Zod schemas for OtterSeal REST API
 * Provides runtime validation + compile-time type inference
 */

// Request schemas
export const CreateNoteRequestSchema = z.object({
  content: z
    .string()
    .min(1, 'Content required')
    .max(100 * 1024, 'Content too large (max 100KB)'),
  expiresAt: z.number().nullable().optional(),
  burnAfterReading: z.boolean().optional(),
});

export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

// Response schemas
export const GetNoteResponseSchema = z.object({
  content: z.string(),
  expiresAt: z.number().nullable(),
  burnAfterReading: z.boolean(),
});

export type GetNoteResponse = z.infer<typeof GetNoteResponseSchema>;

export const GetNoteMetadataResponseSchema = z.object({
  exists: z.boolean(),
  expiresAt: z.number().nullable(),
  burnAfterReading: z.boolean(),
});

export type GetNoteMetadataResponse = z.infer<typeof GetNoteMetadataResponseSchema>;

export const CreateNoteResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Internal schemas
export const NoteSchema = z.object({
  content: z.string(),
  expires_at: z.number().nullable(),
  burn_after_reading: z.number(),
  created_at: z.number().nullable(),
  updated_at: z.number().nullable(),
});

export type Note = z.infer<typeof NoteSchema>;

export const NoteMetadataSchema = z.object({
  expires_at: z.number().nullable(),
  burn_after_reading: z.number(),
  created_at: z.number().nullable(),
  updated_at: z.number().nullable(),
});

export type NoteMetadata = z.infer<typeof NoteMetadataSchema>;

// WebSocket schemas
export const WSInitMessageSchema = z.object({
  type: z.literal('init'),
  content: z.string(),
});

export type WSInitMessage = z.infer<typeof WSInitMessageSchema>;

export const WSUpdateMessageSchema = z.object({
  type: z.literal('update'),
  content: z.string(),
});

export type WSUpdateMessage = z.infer<typeof WSUpdateMessageSchema>;

export const WSErrorMessageSchema = z.object({
  type: z.literal('error'),
  message: z.string(),
});

export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;

export const WSMessageSchema = z.union([
  WSInitMessageSchema,
  WSUpdateMessageSchema,
  WSErrorMessageSchema,
]);

export type WSMessage = z.infer<typeof WSMessageSchema>;
