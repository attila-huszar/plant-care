export const toDateInputValue = (date: Date) => {
  const time = date.getTime()
  if (!Number.isFinite(time)) return ''
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const toIsoFromDateInput = (value: string) => {
  const [y, m, d] = value.split('-').map((part) => Number.parseInt(part, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null
  }

  const localNoon = new Date(y, m - 1, d, 12, 0, 0, 0)
  return localNoon.toISOString()
}
