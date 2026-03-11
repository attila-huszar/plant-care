export const toIsoString = (
  value: Date | string | null | undefined,
): string | null => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return null
  return parsedDate.toISOString()
}
