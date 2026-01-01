'use client';

import { useState, useRef, useEffect } from 'react';
import { NC_COUNTIES, type County } from '@/lib/county';
import clsx from 'clsx';

interface CountySelectProps {
  value?: string;
  onChange: (county: County | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function CountySelect({
  value,
  onChange,
  placeholder = 'Select a county...',
  className,
  label,
  required,
}: CountySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCounty = value ? NC_COUNTIES.find(c => c.slug === value) : null;

  const filteredCounties = search
    ? NC_COUNTIES.filter(
        c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.includes(search.toLowerCase())
      )
    : NC_COUNTIES;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (county: County) => {
    onChange(county);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedCounty?.name || ''}
          onChange={e => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'placeholder:text-gray-400'
          )}
          aria-label={label || 'Select county'}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        {selectedCounty && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          aria-label="Toggle dropdown"
        >
          <svg
            className={clsx('w-5 h-5 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ul
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-lg shadow-lg"
          role="listbox"
        >
          {filteredCounties.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">No counties found</li>
          ) : (
            filteredCounties.map(county => (
              <li
                key={county.slug}
                onClick={() => handleSelect(county)}
                className={clsx(
                  'px-3 py-2 cursor-pointer',
                  'hover:bg-blue-50',
                  selectedCounty?.slug === county.slug && 'bg-blue-100'
                )}
                role="option"
                aria-selected={selectedCounty?.slug === county.slug}
              >
                {county.name} County
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
