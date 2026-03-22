import { z } from 'zod'
import { idSchema } from './commonSchemas'

const plantNameSchema = z.string().trim().min(1).max(60)
const actionIdSchema = z.string().trim().min(1).max(60)
const customEventNameSchema = z.string().trim().min(1).max(60)
const notesSchema = z.string().trim().max(1000)
const imageUrlSchema = z.string().trim().max(2048)

export const scheduleSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.uuid(),
    type: z.literal('recurring'),
    actionId: actionIdSchema,
    days: z.int().positive(),
    notes: notesSchema.optional(),
  }),
  z.object({
    id: z.uuid(),
    type: z.literal('date'),
    actionId: actionIdSchema,
    date: z.iso.datetime(),
    notes: notesSchema.optional(),
  }),
])

export const schedulesSchema = z.array(scheduleSchema)

const eventBaseSchema = z.object({
  actionId: actionIdSchema,
  date: z.iso.datetime(),
  notes: notesSchema.optional(),
})

const plantBaseSchema = z.strictObject({
  name: plantNameSchema,
  schedules: schedulesSchema,
  imageUrl: imageUrlSchema.nullable().optional(),
})

export const createEventRequestSchema = eventBaseSchema

export const createCustomEventRequestSchema = z.object({
  name: customEventNameSchema,
})

export const createPlantRequestSchema = plantBaseSchema.extend({
  schedules: schedulesSchema.default([]),
})

export const updatePlantRequestSchema = plantBaseSchema.partial()

export const eventSchema = z.strictObject({
  id: idSchema,
  plantId: idSchema,
  actionId: actionIdSchema,
  date: z.iso.datetime(),
  notes: notesSchema.nullable(),
})

export const customEventSchema = z.strictObject({
  id: z.uuid(),
  name: customEventNameSchema,
})

export const plantSchema = plantBaseSchema.extend({
  id: idSchema,
  history: z.array(eventSchema),
})

export const listPlantsResponseSchema = z.strictObject({
  plants: z.array(plantSchema),
})

export const createEventResponseSchema = z.strictObject({
  event: eventSchema,
  plant: plantSchema,
})
