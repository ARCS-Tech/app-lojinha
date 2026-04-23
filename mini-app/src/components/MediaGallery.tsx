import { useState } from 'react'

interface MediaItem { url: string; type: string }

export default function MediaGallery({ media }: { media: MediaItem[] }) {
  const [current, setCurrent] = useState(0)
  if (media.length === 0) {
    return <div className="aspect-square w-full bg-tg-secondary flex items-center justify-center text-6xl">🛍️</div>
  }
  return (
    <div>
      <div className="aspect-square w-full bg-tg-secondary overflow-hidden">
        {media[current].type === 'video'
          ? <video src={media[current].url} controls className="w-full h-full object-cover" />
          : <img src={media[current].url} alt="" className="w-full h-full object-cover" />}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar">
          {media.map((m, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`flex-none w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === current ? 'border-tg-button' : 'border-transparent'}`}>
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
