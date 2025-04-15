'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonacoCodeBlock } from '@/components/code/monaco-code-block';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCode, Code, GitBranch, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  InfoCard,
  InfoCardTitle,
  InfoCardContent,
} from '@/components/ui/info-card';

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
      <div className="animate-pulse space-y-4 w-full max-w-5xl mx-auto">
        <div className="h-10 bg-muted rounded w-full max-w-md"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Improved Query Transformation Section */}
      {query && (
        // Use Card for better structure and styling
        <Card className="mb-8 border-blue-200 bg-blue-50/50 shadow-sm"> 
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-lg font-semibold text-blue-900">Understanding Your Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-5">
            {/* Original Query */}
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1.5">Your Query:</h4>
              {/* Use a distinct background/border for the query itself */}
              <p className="text-base font-medium text-gray-800 bg-white p-3 rounded-md border border-gray-200 shadow-inner"> 
                "{query.originalQuery}"
              </p>
            </div>

            {/* Transformed Query & Explanation Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1.5">Transformed to GitHub Syntax:</h4>
                {/* Style the code block */}
                <code className="block text-sm bg-gray-100 border border-gray-300 p-3 rounded-md font-mono overflow-x-auto text-gray-900 shadow-inner"> 
                  {query.transformedQuery}
                </code>
              </div>
               <div>
                 <h4 className="text-sm font-medium text-blue-800 mb-1.5">How we interpreted it:</h4>
                  {/* Style the explanation box (removed h-full) */}
                 <div className="text-sm text-blue-900/95 bg-white p-3 rounded-md border border-gray-200 shadow-inner space-y-3"> 
                   <p>{query.explanation}</p>
                   
                   {/* Add structural context */}
                   <div>
                     <p className="text-xs text-gray-600 mb-1">
                       This query uses the following structure: <code className="text-xs bg-gray-100 px-1 rounded">[Keywords] language:[language] ...</code>
                     </p>
                     <p className="text-xs text-gray-500">
                       Other qualifiers like <code className="text-xs bg-gray-100 px-1 rounded">repo:</code>, <code className="text-xs bg-gray-100 px-1 rounded">user:</code>, <code className="text-xs bg-gray-100 px-1 rounded">path:</code> could also be included based on your query.
                     </p>
                   </div>
                   {/* End structural context */}
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Filter results..."
            value={filterText}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full text-gray-900" // Added text color
          />
        </div>
        <div className="flex gap-2">
          {/* Added light theme classes to SelectTrigger and SelectContent */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-300">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="relevance">Sort by Relevance</SelectItem>
              <SelectItem value="stars">Sort by Stars</SelectItem>
              <SelectItem value="recent">Sort by Recent</SelectItem> {/* Note: 'recent' currently uses matchScore */}
            </SelectContent>
          </Select>
          {languages.length > 0 && (
            /* Added light theme classes to SelectTrigger and SelectContent */
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[150px] bg-white text-gray-900 border-gray-300">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
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

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredResults.length} results
        {filterText && (
          <span>
            {' '}
            for <span className="font-medium">&ldquo;{filterText}&rdquo;</span>
          </span>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))
        ) : (
          <div className="text-center py-12">
            <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium">No results found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasCodeSnippet = result.codeSnippet?.code && result.codeSnippet.code.trim() !== '';

  return (
    <Card className="mb-4 overflow-hidden transition-shadow duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-lg">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <CardTitle className="text-base font-medium text-gray-800 truncate">
              <a
                href={result.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline transition-colors"
              >
                {result.repository.full_name}
              </a>
            </CardTitle>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-gray-200">
            <Star className="h-3 w-3 text-yellow-500" />
            <span>{result.repository.stars}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-0">
        <div className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          <a
            href={
              result.html_url ||
              `${result.repository.html_url}/blob/master/${result.path}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline transition-colors truncate"
          >
            {result.path}
          </a>
        </div>
      </CardContent>

      {/* Code Area: Collapsible Block or Placeholder */}
      <CardContent className="px-4 pt-0 pb-0"> {/* Adjusted padding */}
        {hasCodeSnippet ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className={`relative border border-gray-200 rounded-md overflow-hidden ${isOpen ? '' : 'max-h-[200px]'}`}>
              <MonacoCodeBlock
                code={isOpen && result.fullContent ? result.fullContent : result.codeSnippet.code}
                language={result.codeSnippet.language}
                height={isOpen ? 'auto' : '200px'}
                className="border-none"
              />
              {!isOpen && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            <CollapsibleTrigger asChild>
              <div className="pt-1 pb-2 flex justify-center border-t border-gray-100 mt-3">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-800">
                  {isOpen ? 'Show Less' : 'Show More'}
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-0 pb-0"> {/* Adjusted padding */}
              {/* Footer content moved below */}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="text-center text-sm text-gray-500 italic py-4 my-3 border border-dashed border-gray-200 rounded-md">
            Code snippet not applicable for this result type.
          </div>
        )}
      </CardContent>

      {/* Footer: Badges and Button - Always rendered below code/placeholder */}
      <div className={`px-4 pb-4 pt-2 ${hasCodeSnippet && !isOpen ? 'border-t border-gray-100 mt-0' : ''} ${hasCodeSnippet && isOpen ? 'border-t border-gray-100 mt-0' : ''} ${!hasCodeSnippet ? 'border-t border-gray-100 mt-3' : ''}`}> {/* Conditional top border */}
         {/* Separator only shown when code is present and expanded */}
         {hasCodeSnippet && isOpen && <Separator className="mb-3 bg-gray-200" />}
         <div className="flex justify-between items-center pt-1">
           <div className="flex items-center gap-2">
             {/* Display language badge if available */}
             {result.codeSnippet?.language && (
               <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-gray-200">
                 <Code className="h-3 w-3" />
                 <span>{result.codeSnippet.language}</span>
               </Badge>
             )}
             <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-gray-200">
               <Star className="h-3 w-3 text-yellow-500" />
               <span>{result.repository.stars}</span>
             </Badge>
           </div>
           <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-ring" asChild>
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
      </div>
    </Card>
  );
}
