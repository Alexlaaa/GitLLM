"use client";

import { useEffect, useId, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchSuggestion {
  id: string | number;
  text: string;
  category?: string;
}

interface SearchBarProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  onSearch?: (query: string) => void;
  onSuggestionSelected?: (suggestion: SearchSuggestion) => void;
  maxSuggestions?: number;
  className?: string;
  autoFocus?: boolean;
}

const AdvancedSearchBar = ({
  placeholder = "Search...",
  suggestions = [],
  onSearch,
  onSuggestionSelected,
  maxSuggestions = 5,
  className = "",
  autoFocus = false,
}: SearchBarProps) => {
  const id = useId();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim() === "") {
      setFilteredSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Simulate loading delay
    const timer = setTimeout(() => {
      const filtered = suggestions
        .filter((suggestion) =>
          suggestion.text.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxSuggestions);

      setFilteredSuggestions(filtered);
      setIsLoading(false);

      if (filtered.length > 0) {
        setOpen(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, suggestions, maxSuggestions]);

  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setOpen(false);
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setFilteredSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          className="peer pr-9 pl-9"
          placeholder={placeholder}
          type="search"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
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
        {query && (
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear search"
            type="button"
            onClick={clearSearch}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <Popover
        open={open && filteredSuggestions.length > 0}
        onOpenChange={setOpen}
      >
        <PopoverTrigger className="hidden">Open</PopoverTrigger>
        <PopoverContent
          className="w-full p-0 border-input shadow-md"
          align="start"
          sideOffset={5}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.text}
                    onSelect={() => handleSuggestionClick(suggestion)}
                    className="flex items-center cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span>{suggestion.text}</span>
                      {suggestion.category && (
                        <span className="text-xs text-muted-foreground">
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AdvancedSearchBar;
