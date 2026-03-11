interface VoiceNotesListProps {
  voiceNotes: string[]
}

export default function VoiceNotesList({ voiceNotes }: VoiceNotesListProps) {
  if (voiceNotes.length === 0) return null

  return (
    <div className="mb-4 sm:mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Voice Notes ({voiceNotes.length})
      </label>
      <div className="space-y-2">
        {voiceNotes.map((note, i) => (
          <audio key={i} src={note} controls className="w-full" />
        ))}
      </div>
    </div>
  )
}
