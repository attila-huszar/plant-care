const DAY_MS = 1000 * 60 * 60 * 24

const RELATIVE_DAY_FORMATTER = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

const MEDIUM_DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
})

const isValidDate = (date: Date) => Number.isFinite(date.getTime())

export const formatRelativeDayFromIsoToToday = (isoString: string) => {
  const date = new Date(isoString)
  if (!isValidDate(date)) return ''

  const day = new Date(date)
  day.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((day.getTime() - today.getTime()) / DAY_MS)
  return RELATIVE_DAY_FORMATTER.format(diffDays, 'day')
}

export const formatRelativeDayFromIsoToNow = (isoString: string) => {
  const date = new Date(isoString)
  if (!isValidDate(date)) return ''

  const diffDays = Math.round((date.getTime() - Date.now()) / DAY_MS)
  return RELATIVE_DAY_FORMATTER.format(diffDays, 'day')
}

export const formatMediumDateFromIso = (isoString: string) => {
  const date = new Date(isoString)
  if (!isValidDate(date)) return ''
  return MEDIUM_DATE_FORMATTER.format(date)
}
