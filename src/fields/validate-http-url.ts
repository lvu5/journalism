/**
 * Shared validation for URL fields that are rendered into links on the public
 * site. Only http(s) is allowed, so stored values like `javascript:…` can
 * never become clickable. Empty values pass — `required` handles those.
 */
export const validateHttpUrl = (value: unknown): true | string => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Enter a valid URL.'

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL must start with http:// or https://.'
    }
    return true
  } catch {
    return 'Enter a valid URL.'
  }
}
