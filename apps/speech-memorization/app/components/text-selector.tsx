import { useState } from 'react'
import { Card } from '@ssc/ui'
import { Badge } from '@ssc/ui'
import { Button } from '@ssc/ui'
import { SEED_TEXTS, type TextItem } from '~/lib/texts'
import { getCustomTexts, saveCustomText, removeCustomText } from '~/lib/storage'

export function TextSelector({
  onSelect,
}: {
  onSelect: (text: TextItem) => void
}) {
  const [customTexts, setCustomTexts] = useState(getCustomTexts)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customContent, setCustomContent] = useState('')

  const allTexts = [...SEED_TEXTS, ...customTexts]

  function handleSaveCustom() {
    if (!customContent.trim()) return

    const text: TextItem = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'Custom Text',
      content: customContent.trim(),
      category: 'custom',
    }
    saveCustomText(text)
    setCustomTexts(getCustomTexts())
    setCustomTitle('')
    setCustomContent('')
    setShowCustomForm(false)
    onSelect(text)
  }

  function handleRemoveCustom(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeCustomText(id)
    setCustomTexts(getCustomTexts())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Choose a Text</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Cancel' : '+ Custom Text'}
        </Button>
      </div>

      {showCustomForm && (
        <Card variant="bordered" padding="lg" className="space-y-4">
          <input
            type="text"
            placeholder="Title (optional)"
            aria-label="Speech title"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <textarea
            placeholder="Paste or type the text you want to memorize..."
            aria-label="Speech content to memorize"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            rows={5}
            className="w-full bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-y"
          />
          <Button onClick={handleSaveCustom} disabled={!customContent.trim()}>
            Save & Practice
          </Button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {allTexts.map((text) => (
          <Card
            key={text.id}
            variant="bordered"
            padding="md"
            interactive
            className="group"
          >
            <div
              role="button"
              tabIndex={0}
              className="w-full text-left"
              onClick={() => onSelect(text)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(text)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-text-primary group-hover:text-accent-bright transition-colors">
                  {text.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={text.category === 'custom' ? 'info' : 'default'}
                    size="sm"
                  >
                    {text.category}
                  </Badge>
                  {text.category === 'custom' && (
                    <button
                      onClick={(e) => handleRemoveCustom(text.id, e)}
                      className="text-text-muted hover:text-error text-xs p-1"
                      aria-label="Remove custom text"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">
                {text.content}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {text.content.split(/\s+/).length} words
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
