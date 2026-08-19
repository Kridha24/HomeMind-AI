import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const MESSAGES = [
  'HomeMind is thinking ahead.',
  'Your household, intelligently organized.',
  'One AI for your entire home.',
  'Everything connected. One HomeMind.',
];

export const DynamicAIMessage: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 backdrop-blur-md">
      <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
      <span
        className={`text-xs font-medium text-blue-200 tracking-wide transition-opacity duration-300 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ✦ {MESSAGES[index]}
      </span>
    </div>
  );
};
