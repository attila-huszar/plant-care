import type z from 'zod'
import type {
  careRuleSchema,
  createCustomEventRequestSchema,
  createEventRequestSchema,
  createEventResponseSchema,
  createPlantRequestSchema,
  customEventDtoSchema,
  eventDtoSchema,
  listPlantsResponseSchema,
  plantDtoSchema,
  updatePlantRequestSchema,
} from '../validation'

export type CareRule = z.infer<typeof careRuleSchema>
export type PlantDto = z.infer<typeof plantDtoSchema>
export type EventDto = z.infer<typeof eventDtoSchema>
export type ListPlantsResponse = z.infer<typeof listPlantsResponseSchema>
export type CreateEventRequest = z.infer<typeof createEventRequestSchema>
export type CreatePlantRequest = z.infer<typeof createPlantRequestSchema>
export type UpdatePlantRequest = z.infer<typeof updatePlantRequestSchema>
export type CreateCustomEventRequest = z.infer<
  typeof createCustomEventRequestSchema
>
export type CreateEventResponse = z.infer<typeof createEventResponseSchema>
export type CustomEventDto = z.infer<typeof customEventDtoSchema>
