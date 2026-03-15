import { z } from 'zod'

const idSchema = z.coerce.number().int()

const plantNameSchema = z.string().trim().min(1).max(60)
const imageUrlSchema = z.string().trim().max(2048)
const notesSchema = z.string().trim().max(1000)

export type EventType = string

const eventTypeSchema = z.string().trim().min(1).max(60)

export const careRuleSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('recurring'),
    id: z.uuid(),
    type: eventTypeSchema,
    days: z.int().positive(),
    notes: notesSchema.optional(),
  }),
  z.object({
    kind: z.literal('date'),
    id: z.uuid(),
    type: eventTypeSchema,
    date: z.iso.datetime(),
    notes: notesSchema.optional(),
  }),
])

export const careRulesSchema = z.array(careRuleSchema)

const eventBaseSchema = z.object({
  type: eventTypeSchema,
  date: z.iso.datetime(),
  notes: notesSchema.optional(),
})

const plantBaseSchema = z.strictObject({
  name: plantNameSchema,
  careRules: careRulesSchema,
  imageUrl: imageUrlSchema.nullable().optional(),
})

export const createEventRequestSchema = eventBaseSchema

export const createCustomEventRequestSchema = z.object({
  name: eventTypeSchema,
})

export const createPlantRequestSchema = plantBaseSchema.extend({
  careRules: careRulesSchema.default([]),
})

export const updatePlantRequestSchema = plantBaseSchema.partial()

export const eventDtoSchema = z.strictObject({
  id: idSchema,
  plantId: idSchema,
  type: eventTypeSchema,
  date: z.iso.datetime(),
  notes: notesSchema.nullable(),
})

export const customEventDtoSchema = z.strictObject({
  id: z.uuid(),
  name: eventTypeSchema,
})

export const plantDtoSchema = plantBaseSchema.extend({
  id: idSchema,
  history: z.array(eventDtoSchema),
})

export const listPlantsResponseSchema = z.strictObject({
  plants: z.array(plantDtoSchema),
})

export const createEventResponseSchema = z.strictObject({
  event: eventDtoSchema,
  plant: plantDtoSchema,
})
