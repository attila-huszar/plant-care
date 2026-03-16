import { DEFAULT_TASK_ICON, PLANT_CARE_META } from '@/constants'
import type { CustomEventDto, EventType } from '@plant-care/shared'

const BUILTIN_ACTION_META_BY_ID = new Map(
  PLANT_CARE_META.map((t) => [t.id, t] as const),
)

export const buildCustomTypeNameById = (
  customEvents: readonly CustomEventDto[],
) => {
  const map = new Map<string, string>()
  for (const t of customEvents) {
    map.set(t.id, t.name)
  }
  return map
}

export const getEventIcon = (typeId: EventType) => {
  return BUILTIN_ACTION_META_BY_ID.get(typeId)?.icon ?? DEFAULT_TASK_ICON
}

export const getEventLabel = (
  typeId: EventType,
  customNameById?: ReadonlyMap<string, string>,
) => {
  const builtinLabel = BUILTIN_ACTION_META_BY_ID.get(typeId)?.label
  if (builtinLabel) return builtinLabel
  return customNameById?.get(typeId) ?? typeId
}
