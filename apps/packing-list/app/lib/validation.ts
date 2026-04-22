const MAX_LENGTHS = {
  name: 200,
  title: 200,
  description: 2000,
  body: 5000,
  notes: 1000,
  contributor: 100,
  url: 500,
} as const

export function validateLength(
  value: string,
  field: keyof typeof MAX_LENGTHS
): string | null {
  if (value.length > MAX_LENGTHS[field]) {
    return `${field} must be ${MAX_LENGTHS[field]} characters or less`
  }
  return null
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required`
  }
  return null
}
