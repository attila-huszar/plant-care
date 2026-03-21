import { DEFAULT_TASK_ICON, scheduleActionsMeta } from '@/constants'
import { getBuiltinScheduleAction } from '@plant-care/shared'
import type { CustomEvent, Event, Plant } from '@plant-care/shared'
import type { ScheduleItem } from '@/types'
import { MS_PER_DAY, startOfDayMs } from './dateFormat'

export const buildCustomEventsMap = (customEvents: readonly CustomEvent[]) => {
  const map = new Map<string, string>()
  for (const t of customEvents) {
    map.set(t.id, t.name)
  }
  return map
}

export const getEventIcon = (actionId: string) => {
  return (
    scheduleActionsMeta.find((a) => a.id === actionId)?.icon ??
    DEFAULT_TASK_ICON
  )
}

export const getEventLabel = (
  actionId: string,
  customNameById?: ReadonlyMap<string, string>,
) => {
  const builtinLabel = getBuiltinScheduleAction(actionId)?.label
  if (builtinLabel) return builtinLabel

  return customNameById?.get(actionId) ?? actionId
}

const buildLatestEventsMap = (events: readonly Event[]) => {
  const map = new Map<string, number>()
  for (const event of events) {
    const ms = new Date(event.date).getTime()
    if (!Number.isFinite(ms)) continue
    const key = `${event.plantId}:${event.actionId}`
    const prev = map.get(key)
    if (prev === undefined || ms > prev) map.set(key, ms)
  }
  return map
}

const buildLatestNotesMap = (events: readonly Event[]) => {
  const map = new Map<string, string>()

  const datedEvents: { event: Event; ms: number }[] = []
  for (const event of events) {
    const ms = new Date(event.date).getTime()
    if (!Number.isFinite(ms)) continue
    datedEvents.push({ event, ms })
  }

  datedEvents.sort((a, b) => b.ms - a.ms)

  for (const { event } of datedEvents) {
    const notes = event.notes?.trim()
    if (!notes) continue
    const key = `${event.plantId}:${event.actionId}`
    if (!map.has(key)) map.set(key, notes)
  }
  return map
}

export const buildUpcomingSchedules = (
  plants: readonly Plant[],
  events: readonly Event[],
): ScheduleItem[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const latestEventMsByPlantAndActionId = buildLatestEventsMap(events)
  const latestNotesByPlantAndActionId = buildLatestNotesMap(events)

  const items: ScheduleItem[] = []

  for (const plant of plants) {
    for (const schedule of plant.schedules) {
      if (schedule.type === 'recurring') {
        if (schedule.days <= 0) continue

        const key = `${plant.id}:${schedule.id}`
        const lastEventKey = `${plant.id}:${schedule.actionId}`
        const lastEventMs = latestEventMsByPlantAndActionId.get(lastEventKey)
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
          actionId: schedule.actionId,
          notes:
            schedule.notes?.trim() ||
            latestNotesByPlantAndActionId.get(lastEventKey),
          dueDate,
          diffDays,
          type: 'recurring',
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
        actionId: schedule.actionId,
        notes:
          schedule.notes?.trim() ||
          latestNotesByPlantAndActionId.get(`${plant.id}:${schedule.actionId}`),
        dueDate,
        diffDays,
        type: 'date',
      })
    }
  }

  return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}
