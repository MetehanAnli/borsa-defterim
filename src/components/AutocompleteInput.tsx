import React, { useState, useRef, useEffect } from 'react';
import { cn } from './Card';

interface AutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  options: { label: string; value: string }[];
  onSelectOption: (value: string) => void;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ className, label, error, icon, options, value, onChange, onSelectOption, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(
      opt => opt.value.toLowerCase().includes(String(value || '').toLowerCase()) || 
             opt.label.toLowerCase().includes(String(value || '').toLowerCase())
    ).slice(0, 8);

    const isCustomValue = value && value.length > 2 && !options.find(opt => opt.value.toLowerCase() === String(value).toLowerCase());

    return (
      <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
        {label && <label className="text-sm font-medium text-[var(--text-muted)]">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            value={value}
            onChange={(e) => {
              if (onChange) onChange(e);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={cn(
              "w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5",
              "text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              icon && "pl-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
        
        {isOpen && (filteredOptions.length > 0 || isCustomValue) && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-main)] focus:bg-[var(--bg-main)] outline-none flex items-center justify-between"
                onClick={() => {
                  onSelectOption(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="font-bold text-[var(--text-main)]">{opt.value}</span>
                <span className="text-xs text-[var(--text-muted)] truncate max-w-[60%]">{opt.label}</span>
              </button>
            ))}
            {isCustomValue && (
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-[#10b981]/10 focus:bg-[#10b981]/10 outline-none flex items-center justify-between border-t border-[var(--border-color)]"
                onClick={() => {
                  onSelectOption(String(value).toUpperCase());
                  setIsOpen(false);
                }}
              >
                <span className="font-bold text-[#10b981]">{String(value).toUpperCase()}</span>
                <span className="text-xs text-[#10b981] opacity-80 truncate max-w-[60%]">Özel Hisse (Borsadan Ara)</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

AutocompleteInput.displayName = 'AutocompleteInput';
