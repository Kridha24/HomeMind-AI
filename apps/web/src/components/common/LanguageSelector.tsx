import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';
import { SUPPORTED_LANGUAGES, useI18n } from '../../utils/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useSettingStore();
  const { currentLangDef, supportedLanguages } = useI18n();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langKey: string) => {
    const langObj = supportedLanguages[langKey];
    if (langObj) {
      setLanguage(langObj.code);
      localStorage.setItem('hm_language', langObj.code);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
          compact
            ? 'bg-secondary/70 border-primary/80 text-primary hover:border-blue-500/50'
            : 'bg-secondary/70 border-primary/80 text-primary hover:bg-secondary/90 shadow-xs'
        }`}
        title="Switch Language / भाषा बदलें"
      >
        <span className="text-sm leading-none">{currentLangDef.flag}</span>
        <span className="hidden md:inline">{currentLangDef.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-panel/95 backdrop-blur-xl border border-primary/80 rounded-2xl shadow-2xl z-[9999] py-1.5 divide-y divide-slate-200 dark:divide-slate-800/60 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2">
            <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">
              Select Language / भाषा चुनें
            </span>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin">
            {Object.values(supportedLanguages).map((lang) => {
              const isSelected = currentLangDef.code === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-300 font-bold'
                      : 'text-primary hover:bg-secondary/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div className="text-left">
                      <span className="block">{lang.nativeName}</span>
                      <span className="text-[10px] text-muted block">{lang.name}</span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
