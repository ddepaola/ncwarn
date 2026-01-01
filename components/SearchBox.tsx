'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

interface SearchBoxProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBox({
  placeholder = 'Search...',
  paramName = 'q',
  className,
  onSearch,
}: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(paramName) || '');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (onSearch) {
        onSearch(query);
      } else {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set(paramName, query);
        } else {
          params.delete(paramName);
        }
        router.push(`?${params.toString()}`);
      }
    },
    [query, onSearch, router, searchParams, paramName]
  );

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(paramName);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'w-full pl-10 pr-10 py-2 border rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'placeholder:text-gray-400'
          )}
          aria-label="Search"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
