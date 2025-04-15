"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonacoCodeBlock } from "@/components/code/monaco-code-block";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileCode, Code, GitBranch, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCard, InfoCardTitle, InfoCardContent } from "@/components/ui/info-card";

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
  className = "",
}: SearchResultsDisplayProps) {
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [filterText, setFilterText] = useState<string>("");

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
      if (languageFilter !== "all" && result.repository.language) {
        return result.repository.language.toLowerCase() === languageFilter.toLowerCase();
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "stars":
          return b.repository.stars - a.repository.stars;
        case "recent":
          // For demo purposes we'll use match score as a proxy for recency
          return b.matchScore - a.matchScore;
        case "relevance":
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
      {/* Query Transformation Card */}
      {query && (
        <InfoCard className="mb-6">
          <InfoCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InfoCardTitle>Original Query</InfoCardTitle>
                <div className="rounded-md bg-muted p-2 text-sm font-mono">
                  {query.originalQuery}
                </div>
              </div>
              <div>
                <InfoCardTitle>GitHub Search Syntax</InfoCardTitle>
                <div className="rounded-md bg-muted p-2 text-sm font-mono overflow-x-auto">
                  {query.transformedQuery}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <InfoCardTitle>Explanation</InfoCardTitle>
              <div className="text-sm text-muted-foreground">
                {query.explanation}
              </div>
            </div>
          </InfoCardContent>
        </InfoCard>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Filter results..."
            value={filterText}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort by Relevance</SelectItem>
              <SelectItem value="stars">Sort by Stars</SelectItem>
              <SelectItem value="recent">Sort by Recent</SelectItem>
            </SelectContent>
          </Select>
          {languages.length > 0 && (
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
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
            {" "}
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

  return (
    <Card className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">
              <a
                href={result.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline transition-colors"
              >
                {result.repository.full_name}
              </a>
            </CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{result.repository.stars}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <a
            href={result.html_url || `${result.repository.html_url}/blob/master/${result.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline transition-colors"
          >
            {result.path}
          </a>
        </div>

        <div className="max-h-[200px] overflow-hidden relative">
          <MonacoCodeBlock
            code={result.codeSnippet.code}
            language={result.codeSnippet.language}
            height={isOpen ? "auto" : "200px"}
          />
          {!isOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>
      </CardContent>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-2 pb-4 flex justify-center">
            <Button variant="ghost" size="sm" className="text-xs">
              {isOpen ? "Show Less" : "Show More"}
            </Button>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="my-2" />
            <div className="space-y-4">
              {result.fullContent && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Full Content</h4>
                  <MonacoCodeBlock
                    code={result.fullContent}
                    language={result.codeSnippet.language}
                    height="auto"
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Code className="h-3 w-3" />
                    <span>{result.codeSnippet.language}</span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    <span>{result.repository.stars}</span>
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <a
                    href={result.html_url || `${result.repository.html_url}/blob/master/${result.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
