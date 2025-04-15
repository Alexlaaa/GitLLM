"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/components/search/search-bar";
import { SearchResultsDisplay } from "@/components/search/search-results-display";
import { Code } from "lucide-react";

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
  const [query, setQuery] = useState("");
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

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery }),
        });

        const data = await response.json();

        if (!response.ok) {
          setQueryTransformation(data.query || null);
          
          setError({
            message: data.error || "Failed to search code",
            details: data.errorDetails || undefined,
            transformedQuery: data.query?.transformedQuery || undefined
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
        const processedResults: SearchResult[] = data.results.map((item: ApiSearchResultItem): SearchResult => { // Removed unused 'index'
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
        });

        setResults(processedResults);
        setQueryTransformation(data.query);
        
      } catch (err) {
        console.error("Search failed:", err);
        setError({
          message: err instanceof Error ? err.message : "An unknown error occurred"
        });
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Removed unused getLanguageFromPath function

  return (
    // Use a slightly lighter gray background and increased vertical padding
    <div className="min-h-screen bg-slate-50 py-16"> 
      <div className="container mx-auto px-4">
        {/* Center the top section, ensure consistent width, adjust margins */}
        <div className="max-w-6xl mx-auto mb-10 text-center"> 
          <h1 className="text-4xl font-semibold text-gray-800 mb-4">Natural Language Code Search</h1> 
          <p className="text-lg text-gray-600 mb-10"> 
            Find code across GitHub using natural language queries. Powered by LLM.
          </p>

          {/* Style the search tips box - slightly softer blue, added shadow */}
          <div className="mb-10 bg-sky-50 border border-sky-200 p-5 rounded-lg text-left shadow-sm"> 
            <h3 className="font-semibold text-sky-800 mb-3 text-base">Search Tips</h3> 
            <ul className="text-sm space-y-1.5 text-sky-700 list-disc list-inside"> 
              <li>Use natural language to describe what you're looking for (e.g., "function to read csv file")</li> 
              <li>Be specific about languages or frameworks (e.g., "React hooks for forms")</li>
              <li>Try different phrasings if results aren't relevant</li>
              <li>Focus on concepts or patterns, not just exact syntax</li>
            </ul>
          </div>
          
          {/* Adjusted margin below search bar */}
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={isLoading}
            autoFocus
            className="mb-10" 
          />

          {/* Style the error message box - slightly softer red, added shadow */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-10 text-left shadow-sm"> 
              <p className="font-semibold mb-1">Search Error</p> 
              <p className="text-sm">{error.message}</p>
              {error.transformedQuery && (
                <p className="text-sm mt-2">
                  <strong className="font-medium">Attempted query:</strong>
                  <code className="ml-1 bg-red-100 px-1 py-0.5 rounded text-xs">{error.transformedQuery}</code>
                </p>
              )}
              {error.details && (
                <p className="text-sm mt-1">
                  <strong className="font-medium">Details:</strong> {error.details}
                </p>
              )}
              <p className="text-sm mt-2">Please try refining your search.</p>
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
          ) : !error && query === "" ? (
            // Refined initial placeholder state styling
            <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-lg shadow-sm"> 
              <Code className="h-16 w-16 mx-auto mb-6 text-gray-400" /> 
              <h2 className="text-xl font-medium text-gray-700 mb-3">Start Searching</h2> 
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed"> 
                Enter a natural language query above to find relevant code snippets from GitHub. 
                <br /> For example: &ldquo;React hooks for form validation&rdquo; or &ldquo;async file handling in Node.js&rdquo;
              </p>
            </div>
          ) : !error && (
            // Refined no results state styling
            <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-lg shadow-sm"> 
              <Code className="h-16 w-16 mx-auto mb-6 text-gray-400" /> 
              <h2 className="text-xl font-medium text-gray-700 mb-3">No Results Found</h2> 
              <p className="text-gray-500 text-sm"> 
                We couldn't find any matches for your query. Try refining your search terms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
