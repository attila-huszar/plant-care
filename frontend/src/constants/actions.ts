import type { EventType } from '../features/diary/stores/diary'

export const BUILTIN_ACTIONS = [
  { id: 'water' as const, label: 'Water', icon: '💧' },
  { id: 'fertilize' as const, label: 'Fertilize', icon: '🧪' },
  { id: 'repot' as const, label: 'Repot', icon: '🪴' },
] as const

export const DEFAULT_ACTION_ICON = '📝'

export const getBuiltinActionLabel = (typeId: EventType) => {
  return BUILTIN_ACTIONS.find((t) => t.id === typeId)?.label ?? null
}

export const getActionIcon = (typeId: EventType) => {
  return (
    BUILTIN_ACTIONS.find((t) => t.id === typeId)?.icon ?? DEFAULT_ACTION_ICON
  )
}
