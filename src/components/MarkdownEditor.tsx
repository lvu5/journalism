'use client'

import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { isCitationKey, normalizeCitationKey, renderCitationReferences } from '@/lib/citations'
import type { Locale } from '@/lib/i18n'

type CitationAutocomplete = {
  activeIndex: number
  end: number
  query: string
  start: number
}

type MarkdownEditorProps = {
  ariaInvalid?: boolean
  citationKeys: string[]
  id: string
  initialValue?: string
  locale: Locale
  maxLength: number
  minLength: number
  name: string
}

export function MarkdownEditor({
  ariaInvalid,
  citationKeys,
  id,
  initialValue = '',
  locale,
  maxLength,
  minLength,
  name,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [value, setValue] = useState(initialValue)
  const [citationAutocomplete, setCitationAutocomplete] = useState<CitationAutocomplete | null>(
    null,
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const copy =
    locale === 'vi'
      ? {
          write: 'Viết',
          preview: 'Xem trước',
          heading: 'Tiêu đề',
          bold: 'Đậm',
          italic: 'Nghiêng',
          quote: 'Trích đoạn',
          list: 'Danh sách',
          link: 'Liên kết',
          citation: 'Trích dẫn',
          citationSuggestions: 'Mã nguồn phù hợp',
          noCitationKeys: 'Hãy thêm mã nguồn ở phần nguồn trích dẫn bên dưới.',
          noCitationMatch: 'Không có mã nguồn phù hợp.',
          empty: 'Nội dung xem trước sẽ xuất hiện ở đây.',
          words: 'từ',
          characters: 'ký tự',
        }
      : {
          write: 'Write',
          preview: 'Preview',
          heading: 'Heading',
          bold: 'Bold',
          italic: 'Italic',
          quote: 'Quote',
          list: 'List',
          link: 'Link',
          citation: 'Citation',
          citationSuggestions: 'Matching source keys',
          noCitationKeys: 'Add a source key in the citation section below.',
          noCitationMatch: 'No matching source key.',
          empty: 'The rendered preview will appear here.',
          words: 'words',
          characters: 'characters',
        }

  const preview = useMemo(
    () =>
      renderCitationReferences(
        value,
        citationKeys.filter(Boolean).map((citationKey) => ({ citationKey })),
      ),
    [citationKeys, value],
  )
  const wordCount = value.trim() ? value.trim().split(/\s+/u).length : 0
  const availableCitationKeys = useMemo(
    () =>
      [...new Set(citationKeys.map(normalizeCitationKey))].filter(
        (citationKey) => citationKey && isCitationKey(citationKey),
      ),
    [citationKeys],
  )
  const citationSuggestions = useMemo(() => {
    if (!citationAutocomplete) return []
    const query = normalizeCitationKey(citationAutocomplete.query)
    return availableCitationKeys.filter((citationKey) => citationKey.startsWith(query))
  }, [availableCitationKeys, citationAutocomplete])

  const updateCitationAutocomplete = (markdown: string, cursor: number) => {
    const activeCitation = markdown.slice(0, cursor).match(/\\cite\{[^{}\n]*$/)
    if (!activeCitation) {
      setCitationAutocomplete(null)
      return
    }

    const citationContents = activeCitation[0].slice('\\cite{'.length)
    const currentPart = citationContents.split(',').at(-1) || ''
    const query = currentPart.trimStart()
    if (!/^[A-Za-z0-9:_-]*$/.test(query)) {
      setCitationAutocomplete(null)
      return
    }

    const trailingKey = markdown.slice(cursor).match(/^[A-Za-z0-9:_-]*/)?.[0] || ''
    setCitationAutocomplete({
      activeIndex: 0,
      end: cursor + trailingKey.length,
      query,
      start: cursor - query.length,
    })
  }

  const chooseCitationKey = (citationKey: string) => {
    const textarea = textareaRef.current
    if (!textarea || !citationAutocomplete) return
    const hasClosingBrace = value[citationAutocomplete.end] === '}'
    const nextValue = `${value.slice(0, citationAutocomplete.start)}${citationKey}${value.slice(citationAutocomplete.end)}`
    const cursor = citationAutocomplete.start + citationKey.length + (hasClosingBrace ? 1 : 0)
    setValue(nextValue)
    setCitationAutocomplete(null)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const insertCitation = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.slice(start, end)
    const citationKey = selectedText || 'source-key'
    const replacement = `\\cite{${citationKey}}`
    const keyStart = start + '\\cite{'.length
    const keyEnd = keyStart + citationKey.length
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
    setCitationAutocomplete({
      activeIndex: 0,
      end: keyEnd,
      query: selectedText,
      start: keyStart,
    })

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(keyStart, keyEnd)
    })
  }

  const handleCitationOptionClick = (event: MouseEvent<HTMLButtonElement>) => {
    const citationKey = event.currentTarget.dataset.citationKey
    if (citationKey) chooseCitationKey(citationKey)
  }

  const replaceSelection = (
    before: string,
    after: string,
    placeholder: string,
    selectPlaceholder = true,
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selection = value.slice(start, end) || placeholder
    const replacement = `${before}${selection}${after}`
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`)

    requestAnimationFrame(() => {
      textarea.focus()
      const selectionStart = start + before.length
      const selectionEnd = selectPlaceholder
        ? selectionStart + selection.length
        : start + replacement.length
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  const prefixSelection = (prefix: string, placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selection = value.slice(start, end) || placeholder
    const replacement = selection
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n')
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + replacement.length)
    })
  }

  const handleKeyboard = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (citationAutocomplete && event.key === 'Escape') {
      event.preventDefault()
      setCitationAutocomplete(null)
    } else if (citationAutocomplete && citationSuggestions.length && event.key === 'ArrowDown') {
      event.preventDefault()
      setCitationAutocomplete((current) =>
        current
          ? { ...current, activeIndex: (current.activeIndex + 1) % citationSuggestions.length }
          : null,
      )
    } else if (citationAutocomplete && citationSuggestions.length && event.key === 'ArrowUp') {
      event.preventDefault()
      setCitationAutocomplete((current) =>
        current
          ? {
              ...current,
              activeIndex:
                (current.activeIndex - 1 + citationSuggestions.length) % citationSuggestions.length,
            }
          : null,
      )
    } else if (
      citationAutocomplete &&
      citationSuggestions.length &&
      (event.key === 'Enter' || event.key === 'Tab')
    ) {
      event.preventDefault()
      chooseCitationKey(citationSuggestions[citationAutocomplete.activeIndex])
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      replaceSelection('**', '**', locale === 'vi' ? 'văn bản đậm' : 'bold text')
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      replaceSelection('*', '*', locale === 'vi' ? 'văn bản nghiêng' : 'italic text')
    } else if (event.key === 'Tab') {
      event.preventDefault()
      replaceSelection('  ', '', '', false)
    }
  }

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-header">
        <div aria-label={locale === 'vi' ? 'Chế độ trình soạn thảo' : 'Editor mode'} role="tablist">
          <button
            aria-selected={mode === 'write'}
            onClick={() => setMode('write')}
            role="tab"
            type="button"
          >
            {copy.write}
          </button>
          <button
            aria-selected={mode === 'preview'}
            onClick={() => setMode('preview')}
            role="tab"
            type="button"
          >
            {copy.preview}
          </button>
        </div>
        <div
          aria-label={locale === 'vi' ? 'Định dạng Markdown' : 'Markdown formatting'}
          className="markdown-toolbar"
        >
          <button
            onClick={() => prefixSelection('## ', copy.heading)}
            title={copy.heading}
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => replaceSelection('**', '**', copy.bold)}
            title={`${copy.bold} (⌘B)`}
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => replaceSelection('*', '*', copy.italic)}
            title={`${copy.italic} (⌘I)`}
            type="button"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => prefixSelection('> ', copy.quote)}
            title={copy.quote}
            type="button"
          >
            “
          </button>
          <button onClick={() => prefixSelection('- ', copy.list)} title={copy.list} type="button">
            ≡
          </button>
          <button
            onClick={() =>
              replaceSelection(
                '[',
                '](https://)',
                locale === 'vi' ? 'văn bản liên kết' : 'link text',
              )
            }
            title={copy.link}
            type="button"
          >
            ↗
          </button>
          <button onClick={insertCitation} title={copy.citation} type="button">
            [#]
          </button>
        </div>
      </div>

      <textarea
        aria-activedescendant={
          citationAutocomplete && citationSuggestions.length
            ? `${id}-citation-option-${citationAutocomplete.activeIndex}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls={`${id}-citation-suggestions`}
        aria-invalid={ariaInvalid}
        className={mode === 'write' ? '' : 'markdown-editor-hidden'}
        id={id}
        maxLength={maxLength}
        minLength={mode === 'write' ? minLength : undefined}
        name={name}
        onChange={(event) => {
          setValue(event.target.value)
          updateCitationAutocomplete(event.target.value, event.target.selectionStart)
        }}
        onKeyDown={handleKeyboard}
        onSelect={(event) =>
          updateCitationAutocomplete(event.currentTarget.value, event.currentTarget.selectionStart)
        }
        ref={textareaRef}
        required={mode === 'write'}
        rows={22}
        value={value}
      />

      {mode === 'write' && citationAutocomplete && (
        <div
          aria-label={copy.citationSuggestions}
          className="citation-autocomplete"
          id={`${id}-citation-suggestions`}
          role="listbox"
        >
          {citationSuggestions.length ? (
            citationSuggestions.map((citationKey, index) => (
              <button
                aria-selected={citationAutocomplete.activeIndex === index}
                data-citation-key={citationKey}
                id={`${id}-citation-option-${index}`}
                key={citationKey}
                onClick={handleCitationOptionClick}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                {citationKey}
              </button>
            ))
          ) : (
            <span>{availableCitationKeys.length ? copy.noCitationMatch : copy.noCitationKeys}</span>
          )}
        </div>
      )}

      {mode === 'preview' && (
        <div className="markdown-editor-preview markdown-body" role="tabpanel">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {preview}
            </ReactMarkdown>
          ) : (
            <p className="markdown-editor-empty">{copy.empty}</p>
          )}
        </div>
      )}

      <div className="markdown-editor-footer" aria-live="polite">
        <span>
          {wordCount} {copy.words}
        </span>
        <span>
          {value.length.toLocaleString(locale)} / {maxLength.toLocaleString(locale)}{' '}
          {copy.characters}
        </span>
      </div>
    </div>
  )
}
