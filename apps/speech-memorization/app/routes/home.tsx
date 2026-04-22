import { useNavigate } from 'react-router'
import { TextSelector } from '~/components/text-selector'
import type { TextItem } from '~/lib/texts'

export default function Home() {
  const navigate = useNavigate()

  function handleSelect(text: TextItem) {
    navigate(`/practice/${text.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Speech Memorization
        </h1>
        <p className="text-text-secondary">
          Practice memorizing speeches, creeds, and passages with speech
          recognition, typing, or karaoke mode.
        </p>
      </header>

      <TextSelector onSelect={handleSelect} />
    </div>
  )
}
