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
  technicalAnalysis: string;
  bestPractices: string;
  improvementAreas: string;
  overallScore: number; // 1-100 score for implementation quality
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
        <TabsList className="grid w-full grid-cols-2 bg-white p-0 bg-transparent shadow-none">
          <TabsTrigger 
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-800 font-medium py-3 transition-all flex items-center justify-center" 
            value="input"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Pattern Input</span>
          </TabsTrigger>
          <TabsTrigger 
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-800 font-medium py-3 transition-all flex items-center justify-center" 
            value="results" 
            disabled={results.length === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Comparison Results</span> 
            {results.length > 0 && 
              <span className="ml-2 bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">
                {results.length}
              </span>
            }
          </TabsTrigger>
        </TabsList>
        <TabsContent value="input" className="space-y-4 mt-4 w-full">
          <CodePatternInput onSubmit={handlePatternSubmit} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="results" className="space-y-4 mt-4 w-full">
          {isLoading ? (
            <Card className="p-8 flex items-center justify-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md border border-indigo-100">
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-full mb-4">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
                <p className="text-xl font-medium text-gray-800">Analyzing similar implementations...</p>
                <p className="text-gray-600 mt-2">We're searching through GitHub repositories to find the best matches</p>
              </div>
            </Card>
          ) : results.length > 0 ? (
            <ComparisonResults 
              results={results} 
              originalCode={codePattern.code} 
            />
          ) : error ? (
            <Card className="p-8 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-md border border-red-100">
              <div className="flex items-start">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-red-800 mb-2">Error Analyzing Code Pattern</h3>
                  <p className="text-red-600">{error}</p>
                  <p className="mt-3 text-gray-700">Please check your code pattern and try again.</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md border border-indigo-100">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-full mb-4">
                  <svg className="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No Results Yet</h3>
                <p className="text-gray-600 max-w-md">
                  Submit a code pattern using the Pattern Input tab to find similar implementations across GitHub repositories.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
