'use client';

import { useState } from 'react';

const BACKGROUNDS = [
  { id: 'necropolis', name: 'Necropolis', description: 'Cyberpunk neon scene', preview: '🌃' },
  { id: 'ghost', name: 'Ghost', description: 'Spectral ghost with fireflies', preview: '👻' },
];

export default function BackgroundSelector({
  selectedBackground,
  onBackgroundChange,
  className = 'relative inline-block z-20',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const current = BACKGROUNDS.find((b) => b.id === selectedBackground) || BACKGROUNDS[0];

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="bg-black/50 text-white px-3 py-2 rounded-lg border border-white/20 hover:bg-black/70 transition-all duration-200 flex items-center gap-2"
      >
        <span>{current.preview}</span>
        <span className="text-sm font-medium">{current.name}</span>
        <svg className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-black/90 text-white border border-white/20 rounded-lg shadow-xl min-w-[200px] z-[1000]">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => {
                onBackgroundChange?.(bg.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/10 ${
                selectedBackground === bg.id ? 'bg-white/10' : ''
              }`}
            >
              <span>{bg.preview}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{bg.name}</div>
                <div className="text-xs text-white/60">{bg.description}</div>
              </div>
              {selectedBackground === bg.id && (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && <div className="fixed inset-0" onClick={() => setIsOpen(false)} />}
    </div>
  );
}


