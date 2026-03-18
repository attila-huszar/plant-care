export const SCHEDULE_BUILTIN_ACTIONS = [
  { id: 'water', label: 'Watering' },
  { id: 'fertilize', label: 'Fertilize' },
  { id: 'repot', label: 'Repot' },
] as const

export type ScheduleBuiltinAction = (typeof SCHEDULE_BUILTIN_ACTIONS)[number]

export const getBuiltinScheduleAction = (
  id: string,
): ScheduleBuiltinAction | null => {
  return SCHEDULE_BUILTIN_ACTIONS.find((action) => action.id === id) ?? null
}

export type ScheduleActionId = ScheduleBuiltinAction['id'] | (string & {})
