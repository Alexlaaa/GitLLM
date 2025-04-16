'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonacoCodeBlock } from '@/components/code/monaco-code-block';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCode, GitBranch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
interface SearchResultRepository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  owner: string;
  stars: number;
  forks: number;
  language: string | null;
}

interface CodeSnippet {
  code: string;
  language: string;
  lineStart: number;
  lineEnd: number;
}

interface SearchResultItem {
  id: string;
  repository: SearchResultRepository;
  path: string;
  name: string;
  url: string;
  html_url?: string;
  codeSnippet: CodeSnippet;
  matchScore: number;
  fullContent?: string;
}

interface QueryTransformation {
  originalQuery: string;
  transformedQuery: string;
  explanation: string;
}

interface SearchResultsDisplayProps {
  results: SearchResultItem[];
  query: QueryTransformation | null;
  isLoading?: boolean;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

export function SearchResultsDisplay({
  results,
  query,
  isLoading = false,
  onFilterChange,
  className = '',
}: SearchResultsDisplayProps) {
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [filterText, setFilterText] = useState<string>('');

  // Apply filter and sorting to results
  const filteredResults = results
    .filter((result) => {
      // Apply text filter (to repository name, path, and full_name)
      if (filterText) {
        const searchText = filterText.toLowerCase();
        const repoName = result.repository.name.toLowerCase();
        const repoFullName = result.repository.full_name.toLowerCase();
        const path = result.path.toLowerCase();

        if (
          !repoName.includes(searchText) &&
          !repoFullName.includes(searchText) &&
          !path.includes(searchText)
        ) {
          return false;
        }
      }

      // Apply language filter
      if (languageFilter !== 'all' && result.repository.language) {
        return (
          result.repository.language.toLowerCase() ===
          languageFilter.toLowerCase()
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case 'stars':
          return b.repository.stars - a.repository.stars;
        case 'recent':
          return b.matchScore - a.matchScore;
        case 'relevance':
        default:
          return b.matchScore - a.matchScore;
      }
    });

  // Extract unique languages for the filter dropdown
  const languages = Array.from(
    new Set(
      results
        .map((result) => result.repository.language)
        .filter((lang): lang is string => !!lang)
    )
  );

  // Handle filter text change
  const handleFilterChange = (value: string) => {
    setFilterText(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-full mb-6">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">Searching GitHub...</h3>
        <p className="text-gray-600">Finding the best code matches for your query</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Enhanced Query Transformation Section with gradient styling */}
      {query && (
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-md">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-xl font-semibold text-indigo-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Understanding Your Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-6">
            {/* Original Query */}
            <div>
              <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Your Query:
              </h4>
              <p className="text-base font-medium text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                &ldquo;{query.originalQuery}&rdquo;
              </p>
            </div>

            {/* Transformed Query & Explanation Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Transformed to GitHub Syntax:
                </h4>
                <code className="block text-sm bg-gray-800 text-gray-100 p-4 rounded-lg font-mono overflow-x-auto shadow-inner">
                  {query.transformedQuery}
                </code>
              </div>
              <div>
                <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How we interpreted it:
                </h4>
                <div className="text-sm text-blue-900 bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                  <p>{query.explanation}</p>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">
                      This query uses the following structure:{' '}
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        [Keywords] language:[language] ...
                      </code>
                    </p>
                    <p className="text-xs text-gray-500">
                      Other qualifiers like{' '}
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        repo:
                      </code>
                      ,{' '}
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        user:
                      </code>
                      ,{' '}
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        path:
                      </code>{' '}
                      could also be included based on your query.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters with gradient card styling */}
      <Card className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Filter results by name or path..."
              value={filterText}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full h-12 text-gray-900 pl-4 rounded-lg border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-12 bg-white text-gray-900 border-gray-200 rounded-lg shadow-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 border-gray-200">
                <SelectItem value="relevance">Sort by Relevance</SelectItem>
                <SelectItem value="stars">Sort by Stars</SelectItem>
                <SelectItem value="recent">Sort by Recent</SelectItem>
              </SelectContent>
            </Select>
            {languages.length > 0 && (
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[150px] h-12 bg-white text-gray-900 border-gray-200 rounded-lg shadow-sm">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border-gray-200">
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {/* Results Count with improved styling */}
        <div className="mt-4 text-sm text-gray-600 flex items-center">
          <svg className="h-4 w-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>
            {filteredResults.length} results
            {filterText && (
              <span>
                {' '}
                for <span className="font-medium">&ldquo;{filterText}&rdquo;</span>
              </span>
            )}
          </span>
        </div>
      </Card>

      {/* Enhanced Results List */}
      <div className="space-y-5">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))
        ) : (
          <div className="text-center py-16 px-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md border border-indigo-100">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-full mb-6">
                <FileCode className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-3">No results found</h3>
              <p className="text-gray-600 mt-2">
                Try adjusting your search terms or filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasCodeSnippet =
    result.codeSnippet?.code && result.codeSnippet.code.trim() !== '';

  return (
    <Card className="mb-5 overflow-hidden transition-all duration-200 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-100">
      {/* Header with repository info */}
      <CardHeader className="p-0 border-b border-gray-100 overflow-hidden">
        {/* Repository header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium truncate flex items-center">
              <FileCode className="h-4 w-4 mr-2 text-indigo-200" />
              <a
                href={result.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/90 transition-colors"
              >
                {result.repository.full_name}
              </a>
            </CardTitle>
            <div className="flex shrink-0 ml-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-800/40 text-xs font-medium text-white backdrop-blur-sm shadow-sm border border-indigo-400/20">
                <svg className="h-3.5 w-3.5 text-amber-300 mr-1.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                </svg>
                <span>{result.repository.stars.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* File path with elegant design */}
        <div className="px-5 py-3 flex items-center gap-2 bg-gradient-to-r from-gray-50 to-white">
          <div className="bg-indigo-50 rounded-full p-1.5 flex-shrink-0">
            <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <a
              href={
                result.html_url ||
                `${result.repository.html_url}/blob/master/${result.path}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 hover:underline transition-colors truncate block"
            >
              {result.path.split('/').map((part, i, arr) => 
                i === arr.length - 1 ? 
                <span key={i} className="font-semibold text-indigo-700">{part}</span> : 
                <span key={i}>{part}<span className="text-gray-400 mx-0.5">/</span></span>
              )}
            </a>
          </div>
        </div>
      </CardHeader>

      {/* Code Area: Collapsible Block or Placeholder */}
      <CardContent className="p-0">
        {hasCodeSnippet ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div
              className={`relative overflow-hidden ${isOpen ? '' : 'max-h-[200px]'}`}
            >
              <MonacoCodeBlock
                code={
                  isOpen && result.fullContent
                    ? result.fullContent
                    : result.codeSnippet.code
                }
                language={result.codeSnippet.language}
                height={isOpen ? 'auto' : '200px'}
                className="border-none rounded-none"
              />
              {!isOpen && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
              )}
            </div>
            <div className="flex justify-center py-2.5 bg-gray-50 border-t border-gray-100">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full px-4"
                >
                  {isOpen ? 'Show Less' : 'Show More Code'}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent />
          </Collapsible>
        ) : (
          <div className="bg-gray-50 text-center text-sm text-gray-500 italic py-6 px-4 border-t border-b border-gray-100">
            Code snippet not available for this result
          </div>
        )}
      </CardContent>

      {/* Footer with action buttons */}
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 border-t border-gray-100 flex justify-between items-center">
        <div className="text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Relevance match: {Math.round(result.matchScore * 100)}%</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-8 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 focus-visible:ring-indigo-300 shadow-sm"
          asChild
        >
          <a
            href={result.html_url || result.repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            View on GitHub
          </a>
        </Button>
      </div>
    </Card>
  );
}
