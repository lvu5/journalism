'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { renderCitationReferences } from '@/lib/citations'
import type { Locale } from '@/lib/i18n'

type MarkdownEditorProps = {
  ariaInvalid?: boolean
  citationKeys: string[]
  id: string
  locale: Locale
  maxLength: number
  minLength: number
  name: string
}

export function MarkdownEditor({
  ariaInvalid,
  citationKeys,
  id,
  locale,
  maxLength,
  minLength,
  name,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [value, setValue] = useState('')
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
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
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
          <button
            onClick={() => replaceSelection('\\cite{', '}', 'source-key')}
            title={copy.citation}
            type="button"
          >
            [#]
          </button>
        </div>
      </div>

      <textarea
        aria-invalid={ariaInvalid}
        className={mode === 'write' ? '' : 'markdown-editor-hidden'}
        id={id}
        maxLength={maxLength}
        minLength={mode === 'write' ? minLength : undefined}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyboard}
        ref={textareaRef}
        required={mode === 'write'}
        rows={22}
        value={value}
      />

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
