import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';

interface DraggableFABProps {
  onClick: () => void;
  onDismiss: () => void;
}

export const DraggableFAB: React.FC<DraggableFABProps> = ({ onClick, onDismiss }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.dismiss-btn')) return;
    
    e.preventDefault(); 
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      let newX = dragRef.current.initialX + dx;
      let newY = dragRef.current.initialY + dy;
      
      newX = Math.max(10, Math.min(newX, window.innerWidth - 60));
      newY = Math.max(10, Math.min(newY, window.innerHeight - 60));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.dismiss-btn')) return;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (!isDragging && dragRef.current) {
      onClick();
    }
    dragRef.current = null;
    setTimeout(() => setIsDragging(false), 50);
  };

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none'
      }}
      className={`fixed top-0 left-0 z-[9999] ${isDragging ? '' : 'transition-transform duration-200'}`}
    >
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-blue-500/40 border border-blue-400/30 w-14 h-14 cursor-grab active:cursor-grabbing ${isDragging ? '' : 'hover:scale-105 active:scale-95'} group`}
        title="Ask HomeMind AI Assistant"
      >
        <Bot className={`w-6 h-6 text-white ${isDragging ? '' : 'group-hover:rotate-12 transition-transform'}`} />
        <Sparkles className="w-3 h-3 text-blue-200 absolute top-2 right-2 animate-pulse" />
      </button>

      {/* Tiny Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="dismiss-btn absolute -top-1 -right-1 bg-slate-800 text-slate-300 hover:text-white border border-slate-600 rounded-full p-1 shadow-lg cursor-pointer z-10 hover:bg-rose-500 hover:border-rose-400 transition-colors"
        title="Hide AI Button"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
