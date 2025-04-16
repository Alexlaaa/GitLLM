'use client';

import { useId, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  // Removed unused clearSearch function

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            ref={inputRef}
            className="peer pr-9 pl-4 h-12 text-gray-900 rounded-lg border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm" 
            placeholder={placeholder}
            type="search"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            disabled={isLoading}
          />
          {/* Removed the search icon */}
        </div>
        <Button
          type="submit"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-lg"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              Searching...
            </>
          ) : (
            'Find Code'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
