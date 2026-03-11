import { DEFAULT_TASK_ICON, PLANT_CARE_META } from '@/constants'
import type { EventType } from '@/types'

export const getBuiltinActionLabel = (typeId: EventType) => {
  return PLANT_CARE_META.find((t) => t.id === typeId)?.label ?? null
}

export const getActionIcon = (typeId: EventType) => {
  return PLANT_CARE_META.find((t) => t.id === typeId)?.icon ?? DEFAULT_TASK_ICON
}
