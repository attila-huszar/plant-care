export const SCHEDULE_BUILTIN_ACTIONS = [
  { id: 'water', label: 'Watering' },
  { id: 'fertilize', label: 'Fertilize' },
  { id: 'repot', label: 'Repot' },
] as const

export type ScheduleBuiltinAction = (typeof SCHEDULE_BUILTIN_ACTIONS)[number]

export type ScheduleBuiltinActionId =
  (typeof SCHEDULE_BUILTIN_ACTIONS)[number]['id']

export const SCHEDULE_ACTION_MAP = Object.fromEntries(
  SCHEDULE_BUILTIN_ACTIONS.map((action) => [action.id, action]),
) as Record<ScheduleBuiltinActionId, ScheduleBuiltinAction>

export const getBuiltinScheduleAction = (
  id: string,
): ScheduleBuiltinAction | null => {
  const action = (
    SCHEDULE_ACTION_MAP as Partial<Record<string, ScheduleBuiltinAction>>
  )[id]
  return action ?? null
}

export type ScheduleActionId = ScheduleBuiltinActionId | (string & {})
