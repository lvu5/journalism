type CitationReference = {
  citationKey?: string | null
}

const citationPattern = () => /(?<!\\)\\cite\{([^{}\n]+)\}/g

export const normalizeCitationKey = (value: string): string => value.trim().toLowerCase()

export const isCitationKey = (value: string): boolean =>
  /^[a-z][a-z0-9:_-]{0,63}$/.test(normalizeCitationKey(value))

export const extractCitationKeys = (markdown: string): string[] =>
  Array.from(markdown.matchAll(citationPattern())).flatMap((match) =>
    match[1].split(',').map(normalizeCitationKey).filter(Boolean),
  )

export const findUnknownCitationKeys = (markdown: string, availableKeys: string[]): string[] => {
  const available = new Set(availableKeys.map(normalizeCitationKey))
  return [...new Set(extractCitationKeys(markdown).filter((key) => !available.has(key)))]
}

export const citationAnchor = (key: string): string => `citation-${normalizeCitationKey(key)}`

export const renderCitationReferences = (
  markdown: string,
  citations: CitationReference[],
): string => {
  const citationNumbers = new Map<string, number>()
  citations.forEach((citation, index) => {
    const key = normalizeCitationKey(citation.citationKey || `source-${index + 1}`)
    citationNumbers.set(key, index + 1)
  })

  return markdown.replace(citationPattern(), (original, keyList: string) => {
    const keys = keyList.split(',').map(normalizeCitationKey).filter(Boolean)
    const numbers = keys.map((key) => citationNumbers.get(key))
    if (!keys.length || numbers.some((number) => number === undefined)) return original

    return keys.map((key, index) => `[[${numbers[index]}]](#${citationAnchor(key)})`).join('')
  })
}
