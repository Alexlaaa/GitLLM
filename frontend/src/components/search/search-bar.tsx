'use client';

import { useId, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  isLoading?: boolean;
}

const SearchBar = ({
  placeholder = 'Search GitHub code in natural language...',
  onSearch,
  className = '',
  autoFocus = false,
  isLoading = false,
}: SearchBarProps) => {
  const id = useId();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            ref={inputRef}
            className="peer pr-9 pl-9 h-10 text-gray-900" // Added text-gray-900 for visibility
            placeholder={placeholder}
            type="search"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            disabled={isLoading}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            {isLoading ? (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/80"
                role="status"
                aria-label="Loading..."
              />
            ) : (
              <Search size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </div>
          {/* Removed custom clear button, relying on browser default for type="search" */}
        </div>
        <Button
          type="submit"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="h-10"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
