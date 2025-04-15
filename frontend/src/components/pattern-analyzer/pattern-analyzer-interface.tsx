"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';

// Use dynamic imports with SSR disabled for components that use Monaco
const CodePatternInput = dynamic(() => import("./code-pattern-input"), { ssr: false });
const ComparisonResults = dynamic(() => import("./comparison-results"), { ssr: false });
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export interface CodePattern {
  code: string;
  language: string;
  filters: {
    stars?: number;
    forks?: number;
    repoFilter?: string;
    userFilter?: string;
  };
}

export interface Repository {
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
}

export interface AnalysisResult {
  insights: string;
  technicalDetails: string;
  implementationApproach: string;
  bestPractices: string;
  improvementAreas: string;
}

export interface ComparisonResult {
  score: number;
  name: string;
  path: string;
  repository: Repository;
  codeContent: string;
  analysis: AnalysisResult;
}

export default function PatternAnalyzerInterface() {
  const [codePattern, setCodePattern] = useState<CodePattern>({
    code: "",
    language: "",
    filters: {},
  });
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("input");

  const handlePatternSubmit = async (pattern: CodePattern) => {
    setIsLoading(true);
    setError(null);
    setCodePattern(pattern);

    try {
      const response = await fetch("/api/pattern-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codePattern: pattern.code,
          language: pattern.language,
          filters: pattern.filters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze code pattern");
      }

      const data = await response.json();
      setResults(data.results || []);
      
      // If we got results, switch to the results tab
      if (data.results && data.results.length > 0) {
        setActiveTab("results");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-800 w-full max-w-none">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-none">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-900 font-semibold" value="input">
            <span className="text-inherit">Pattern Input</span>
          </TabsTrigger>
          <TabsTrigger className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-900 font-semibold" value="results" disabled={results.length === 0}>
            <span className="text-inherit">Comparison Results</span> {results.length > 0 && `(${results.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="space-y-4 mt-4 w-full">
          <CodePatternInput onSubmit={handlePatternSubmit} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="results" className="space-y-4 mt-4 w-full">
          {isLoading ? (
            <Card className="p-6 flex items-center justify-center bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-lg">Analyzing similar implementations...</p>
            </Card>
          ) : results.length > 0 ? (
            <ComparisonResults 
              results={results} 
              originalCode={codePattern.code} 
            />
          ) : error ? (
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </Card>
          ) : (
            <Card className="p-6 bg-white">
              <p className="text-center text-gray-500">
                No comparison results available. Submit a code pattern to analyze.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
