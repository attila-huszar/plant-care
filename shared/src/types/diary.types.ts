import type z from 'zod'
import type {
  createCustomEventRequestSchema,
  createEventRequestSchema,
  createEventResponseSchema,
  createPlantRequestSchema,
  customEventSchema,
  eventSchema,
  listPlantsResponseSchema,
  plantSchema,
  scheduleSchema,
  updatePlantRequestSchema,
} from '../validation'

export type Schedule = z.infer<typeof scheduleSchema>
export type Plant = z.infer<typeof plantSchema>
export type Event = z.infer<typeof eventSchema>
export type ListPlantsResponse = z.infer<typeof listPlantsResponseSchema>
export type CreateEventRequest = z.infer<typeof createEventRequestSchema>
export type CreatePlantRequest = z.infer<typeof createPlantRequestSchema>
export type UpdatePlantRequest = z.infer<typeof updatePlantRequestSchema>
export type CreateCustomEventRequest = z.infer<
  typeof createCustomEventRequestSchema
>
export type CreateEventResponse = z.infer<typeof createEventResponseSchema>
export type CustomEvent = z.infer<typeof customEventSchema>
