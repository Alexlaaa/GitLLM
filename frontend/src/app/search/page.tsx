"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/components/search/search-bar";
import { SearchResultsDisplay } from "@/components/search/search-results-display";
import { Code } from "lucide-react";

// GitHub API response item type
interface GitHubCodeItem {
  repository: {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    owner?: { login: string };
    stargazers_count?: number;
    forks_count?: number;
    language?: string | null;
  };
  sha?: string;
  path: string;
  name: string;
  url: string;
  html_url?: string;
  score: number;
  text_matches?: Array<{
    fragment?: string;
  }>;
}

// Our processed search result type
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
        
        // Process the response data
        const processedResults: SearchResult[] = data.results.map((item: GitHubCodeItem, index: number) => ({
          id: item.sha || `result-${index}`,
          repository: {
            name: item.repository.name,
            full_name: item.repository.full_name,
            description: item.repository.description,
            html_url: item.repository.html_url,
            owner: item.repository.owner?.login || "unknown",
            stars: item.repository.stargazers_count || 0,
            forks: item.repository.forks_count || 0,
            language: item.repository.language,
          },
          path: item.path,
          name: item.name,
          url: item.url,
          html_url: item.html_url,
          codeSnippet: {
            code: item.text_matches?.[0]?.fragment || "// Code snippet not available",
            language: getLanguageFromPath(item.path),
            lineStart: 1,
            lineEnd: (item.text_matches?.[0]?.fragment?.match(/\n/g) || []).length + 1,
          },
          matchScore: item.score || 0,
        }));

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

  // Helper function to determine language from file path
  const getLanguageFromPath = (path: string): string => {
    const extension = path.split(".").pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      go: "go",
      java: "java",
      html: "html",
      css: "css",
      php: "php",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      swift: "swift",
      rs: "rust",
      kt: "kotlin",
      scala: "scala",
    };
    
    return languageMap[extension || ""] || "plaintext";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-4">Natural Language Code Search</h1>
        <p className="text-muted-foreground mb-6">
          Search for code across GitHub repositories using natural language. Powered by LLM.
        </p>
        
        <SearchBar 
          onSearch={handleSearch} 
          isLoading={isLoading}
          autoFocus
          className="mb-6"
        />

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            <p className="font-medium">Error: {error.message}</p>
            {error.transformedQuery && (
              <p className="text-sm mt-1">
                <strong>Transformed query:</strong> {error.transformedQuery}
              </p>
            )}
            {error.details && (
              <p className="text-sm mt-1">
                <strong>Details:</strong> {error.details}
              </p>
            )}
            <p className="text-sm mt-2">Please try again with a different query.</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        {results.length > 0 || isLoading ? (
          <SearchResultsDisplay 
            results={results}
            query={queryTransformation}
            isLoading={isLoading}
          />
        ) : !error && query === "" ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-medium mb-2">Enter a search query</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try searching for specific code patterns, functionalities or concepts.
              For example: &ldquo;React hooks for form validation&rdquo; or &ldquo;async file handling in Node.js&rdquo;
            </p>
          </div>
        ) : !error && (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-medium mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try another search query or refine your current one.
            </p>
          </div>
        )}
        
        <div className="mt-6 bg-muted p-4 rounded-xl">
          <h3 className="font-medium mb-2">Search Tips</h3>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>Use natural language to describe what you&apos;re looking for</li>
            <li>Be specific about languages or frameworks</li>
            <li>Try different phrasings if you don&apos;t get good results</li>
            <li>Include concepts or patterns rather than exact syntax</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
