'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/search/search-bar';
import { SearchResultsDisplay } from '@/components/search/search-results-display';
import { Code } from 'lucide-react';

// Type for the data structure returned by our /api/search endpoint
interface ApiSearchResultItem {
  id: string;
  repository: {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    owner: string; // API route ensures this exists
    stars: number; // API route ensures this exists
    forks: number; // API route ensures this exists
    language: string | null;
  };
  path: string;
  name: string;
  url: string;
  html_url?: string;
  codeSnippet: {
    code: string; // API route ensures this exists
    language: string; // API route ensures this exists
    lineStart: number; // API route ensures this exists
    lineEnd: number; // API route ensures this exists
  };
  matchScore: number; // API route ensures this exists
  fullContent?: string; // Optional, might not be fetched or available
  score?: number; // Original score from GitHub, might be present
  // Note: 'sha' is not explicitly returned by our API, 'id' is preferred
}

// Our final processed search result type for the UI component
interface SearchResult {
  id: string;
  repository: {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    owner: string;
    stars: number;
    forks: number;
    language: string | null;
  };
  path: string;
  name: string;
  url: string;
  html_url?: string;
  codeSnippet: {
    code: string;
    language: string;
    lineStart: number;
    lineEnd: number;
  };
  matchScore: number;
  fullContent?: string;
  // Include this property to match GitHubSearchResultItem
  score: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [queryTransformation, setQueryTransformation] = useState<{
    originalQuery: string;
    transformedQuery: string;
    explanation: string;
  } | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    details?: string;
    transformedQuery?: string;
  } | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        setQueryTransformation(data.query || null);

        setError({
          message: data.error || 'Failed to search code',
          details: data.errorDetails || undefined,
          transformedQuery: data.query?.transformedQuery || undefined,
        });

        setResults([]);
        setIsLoading(false);
        return;
      }

      // If we got here, the request was successful
      // The API route now returns data matching the SearchResult structure,
      // including codeSnippet and fullContent.

      // Ensure the results match the SearchResult type expected by SearchResultsDisplay
      // Use the ApiSearchResultItem type for the incoming data
      const processedResults: SearchResult[] = data.results.map(
        (item: ApiSearchResultItem): SearchResult => {
          // Removed unused 'index'
          // The API route already provides defaults, but we can keep minimal checks
          const repo = item.repository; // Already validated in API route
          const snippet = item.codeSnippet; // Already validated in API route

          return {
            id: item.id, // Use the ID provided by the API
            repository: {
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              html_url: repo.html_url,
              owner: repo.owner,
              stars: repo.stars,
              forks: repo.forks,
              language: repo.language,
            },
            path: item.path,
            name: item.name,
            url: item.url,
            html_url: item.html_url, // Can be undefined, pass through
            codeSnippet: {
              code: snippet.code,
              language: snippet.language,
              lineStart: snippet.lineStart,
              lineEnd: snippet.lineEnd,
            },
            matchScore: item.matchScore,
            fullContent: item.fullContent, // Pass through fullContent (can be undefined)
            score: item.score || item.matchScore, // Use original score or matchScore as fallback
          };
        }
      );

      setResults(processedResults);
      setQueryTransformation(data.query);
    } catch (err) {
      console.error('Search failed:', err);
      setError({
        message:
          err instanceof Error ? err.message : 'An unknown error occurred',
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Removed unused getLanguageFromPath function

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto mb-10 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Natural Language Code Search
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Find code across GitHub using natural language queries. Powered by
            LLM.
          </p>

          {/* Updated search tips box with gradient background and improved styling */}
          <div className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 p-6 rounded-xl text-left shadow-sm">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-4 text-base">
                  Search Tips
                </h3>
                
                <div className="space-y-5">
                  {/* Code Search section */}
                  <div>
                    <h4 className="font-medium text-indigo-700 mb-2 text-sm">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded mr-2">Code Search</span>
                      Find specific code patterns or implementations
                    </h4>
                    <ul className="text-sm space-y-1.5 text-blue-700 list-disc list-inside ml-1">
                      <li>
                        <strong className="text-indigo-800">Example:</strong>{" "}
                        "TypeORM database configuration in NestJS"
                      </li>
                      <li>
                        <strong className="text-indigo-800">Example:</strong>{" "}
                        "Springboot JWT cookie implementation"
                      </li>
                    </ul>
                  </div>
                  
                  {/* User Search section */}
                  <div>
                    <h4 className="font-medium text-indigo-700 mb-2 text-sm">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded mr-2">User Search</span>
                      Find GitHub users and their repositories
                    </h4>
                    <ul className="text-sm space-y-1.5 text-blue-700 list-disc list-inside ml-1">
                      <li>
                        <strong className="text-indigo-800">Example:</strong>{" "}
                        "Find user visionmedia"
                      </li>
                    </ul>
                  </div>
                  
                  {/* Repository Search section */}
                  <div>
                    <h4 className="font-medium text-indigo-700 mb-2 text-sm">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded mr-2">Repository Search</span>
                      Find specific GitHub repositories
                    </h4>
                    <ul className="text-sm space-y-1.5 text-blue-700 list-disc list-inside ml-1">
                      <li>
                        <strong className="text-indigo-800">Example:</strong>{" "}
                        "Find devops-exercises repository by bregman-arie"
                      </li>
                    </ul>
                  </div>
                  
                  {/* General Tips section */}
                  <div className="pt-1 border-t border-blue-100">
                    <h4 className="font-medium text-indigo-700 mb-2 text-sm">General Tips</h4>
                    <ul className="text-sm space-y-1.5 text-blue-700 list-disc list-inside ml-1">
                      <li>Be specific about programming languages or frameworks</li>
                      <li>Try different phrasings if results aren't relevant</li>
                      <li>Focus on concepts or patterns rather than exact syntax</li>
                      <li>Include version information when applicable (e.g., "React 18")</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Updated search bar to match width of other elements */}
          <div className="mb-10 w-full">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              autoFocus
              className="mb-6"
            />
          </div>

          {/* Updated error message box with improved styling */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-md border border-red-100 p-6 mb-10 text-left">
              <div className="flex items-start">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-red-800 mb-2">
                    Search Error
                  </h3>
                  <p className="text-red-600">{error.message}</p>
                  {error.transformedQuery && (
                    <p className="text-sm mt-2">
                      <strong className="font-medium">Attempted query:</strong>
                      <code className="ml-1 bg-red-100 px-1 py-0.5 rounded text-xs">
                        {error.transformedQuery}
                      </code>
                    </p>
                  )}
                  {error.details && (
                    <p className="text-sm mt-1">
                      <strong className="font-medium">Details:</strong>{' '}
                      {error.details}
                    </p>
                  )}
                  <p className="mt-3 text-gray-700">
                    Please check your query and try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Container for results or placeholders */}
        <div className="max-w-6xl mx-auto">
          {results.length > 0 || isLoading ? (
            <SearchResultsDisplay
              results={results}
              query={queryTransformation}
              isLoading={isLoading}
            />
          ) : !error && query === '' ? (
            // Updated initial placeholder state styling
            <div className="text-center py-20 px-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md border border-indigo-100">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-full mb-6">
                  <Code className="h-12 w-12 text-indigo-500" />
                </div>
                <h2 className="text-xl font-medium text-gray-800 mb-3">
                  Start Searching
                </h2>
                <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
                  Enter a natural language query above to find relevant code
                  snippets from GitHub.
                  <br /> For example: "React hooks for form validation" or
                  "async file handling in Node.js"
                </p>
              </div>
            </div>
          ) : (
            !error && (
              // Updated no results state styling
              <div className="text-center py-20 px-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md border border-indigo-100">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-full mb-6">
                    <Code className="h-12 w-12 text-indigo-500" />
                  </div>
                  <h2 className="text-xl font-medium text-gray-800 mb-3">
                    No Results Found
                  </h2>
                  <p className="text-gray-600 text-sm">
                    We couldn't find any matches for your query. Try refining
                    your search terms.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
