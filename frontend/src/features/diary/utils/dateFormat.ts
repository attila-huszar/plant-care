export const MS_PER_DAY = 1000 * 60 * 60 * 24

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

const mediumDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
})

const parseIsoMs = (isoString: string) => {
  const ms = Date.parse(isoString)
  if (!Number.isFinite(ms)) return null
  return ms
}

export const startOfDayMs = (ms: number) => {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export const formatRelativeDay = (isoString: string) => {
  const ms = parseIsoMs(isoString)
  if (ms === null) return ''

  const dayMs = startOfDayMs(ms)
  const todayMs = startOfDayMs(Date.now())

  const diffDays = Math.round((dayMs - todayMs) / MS_PER_DAY)
  return relativeTimeFormatter.format(diffDays, 'day')
}

export const formatMediumDate = (isoString: string) => {
  const ms = parseIsoMs(isoString)
  if (ms === null) return ''
  return mediumDateFormatter.format(new Date(ms))
}

export const formatDueLabel = (diffDays: number) => {
  if (diffDays === 0) return 'Today'
  const abs = Math.abs(diffDays)
  const unit = abs === 1 ? 'day' : 'days'
  if (diffDays > 0) return `In ${abs} ${unit}`
  return `Overdue by ${abs} ${unit}`
}
