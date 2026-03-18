import { DEFAULT_TASK_ICON, PLANT_CARE_META } from '@/constants'
import type {
  CustomEventDto,
  EventDto,
  EventType,
  PlantDto,
} from '@plant-care/shared'
import type { UpcomingItem } from '@/types'
import { MS_PER_DAY, startOfDayMs } from './dateFormat'

const BUILTIN_ACTION_META_BY_ID = new Map(
  PLANT_CARE_META.map((t) => [t.id, t] as const),
)

export const buildCustomEventsMap = (
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

const buildLatestEventsMap = (events: readonly EventDto[]) => {
  const map = new Map<string, number>()
  for (const event of events) {
    const ms = new Date(event.date).getTime()
    if (!Number.isFinite(ms)) continue
    const key = `${event.plantId}:${event.type}`
    const prev = map.get(key)
    if (prev === undefined || ms > prev) map.set(key, ms)
  }
  return map
}

const buildLatestNotesMap = (events: readonly EventDto[]) => {
  const map = new Map<string, string>()

  const datedEvents: { event: EventDto; ms: number }[] = []
  for (const event of events) {
    const ms = new Date(event.date).getTime()
    if (!Number.isFinite(ms)) continue
    datedEvents.push({ event, ms })
  }

  datedEvents.sort((a, b) => b.ms - a.ms)

  for (const { event } of datedEvents) {
    const notes = event.notes?.trim()
    if (!notes) continue
    const key = `${event.plantId}:${event.type}`
    if (!map.has(key)) map.set(key, notes)
  }
  return map
}

export const buildUpcomingCareItems = (
  plants: readonly PlantDto[],
  events: readonly EventDto[],
): UpcomingItem[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const latestEventMsByPlantAndType = buildLatestEventsMap(events)
  const latestNotesByPlantAndType = buildLatestNotesMap(events)

  const items: UpcomingItem[] = []

  for (const plant of plants) {
    for (const schedule of plant.schedules) {
      if (schedule.kind === 'recurring') {
        if (schedule.days <= 0) continue

        const key = `${plant.id}:${schedule.id}`
        const lastEventKey = `${plant.id}:${schedule.type}`
        const lastEventMs = latestEventMsByPlantAndType.get(lastEventKey)
        const baseMs = startOfDayMs(lastEventMs ?? todayMs)

        const dueBase = new Date(baseMs)
        dueBase.setDate(dueBase.getDate() + schedule.days)
        const dueDayMs = startOfDayMs(dueBase.getTime())
        const dueDate = new Date(dueDayMs)
        const diffDays = Math.round((dueDayMs - todayMs) / MS_PER_DAY)

        items.push({
          key: String(key),
          plantId: plant.id,
          plantName: plant.name,
          scheduleId: schedule.id,
          type: schedule.type,
          notes:
            schedule.notes?.trim() ||
            latestNotesByPlantAndType.get(lastEventKey),
          dueDate,
          diffDays,
          kind: 'recurring',
          days: schedule.days,
        })
        continue
      }

      const dueMs = new Date(schedule.date).getTime()
      if (!Number.isFinite(dueMs)) continue

      const dueDayMs = startOfDayMs(dueMs)
      const dueDate = new Date(dueDayMs)
      const diffDays = Math.round((dueDayMs - todayMs) / MS_PER_DAY)

      items.push({
        key: String(`${plant.id}:${schedule.id}`),
        plantId: plant.id,
        plantName: plant.name,
        scheduleId: schedule.id,
        type: schedule.type,
        notes:
          schedule.notes?.trim() ||
          latestNotesByPlantAndType.get(`${plant.id}:${schedule.type}`),
        dueDate,
        diffDays,
        kind: 'date',
      })
    }
  }

  return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}
