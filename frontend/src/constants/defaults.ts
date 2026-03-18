import { SCHEDULE_BUILTIN_ACTIONS } from '@plant-care/shared'
import type { ScheduleBuiltinAction } from '@plant-care/shared'

const ICON_BY_ID: Record<ScheduleBuiltinAction['id'], string> = {
  water: '💧',
  fertilize: '🧪',
  repot: '🪴',
}

export const DEFAULT_TASK_ICON = '📝'

export const scheduleActionsMeta = SCHEDULE_BUILTIN_ACTIONS.map((action) => ({
  ...action,
  icon: ICON_BY_ID[action.id],
}))
