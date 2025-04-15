'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ComparisonResult } from './pattern-analyzer-interface';
import { MonacoDiffViewer } from '@/components/code/monaco-diff-viewer';
import { ExternalLink, FileCode, GitFork, Star } from 'lucide-react';

interface ComparisonResultsProps {
  results: ComparisonResult[];
  originalCode: string;
}

export default function ComparisonResults({
  results,
  originalCode,
}: ComparisonResultsProps) {
  const [selectedResult, setSelectedResult] = useState<string>(
    results[0]?.path || ''
  );

  // Find the currently selected result
  const currentResult =
    results.find((r) => r.path === selectedResult) || results[0];

  // Helper function to detect language from file extension
  const detectLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rb: 'ruby',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 text-gray-800 w-full mx-auto">
      {/* Similar implementations list - reduced width */}
      <Card className="p-4 lg:col-span-1 bg-white h-full flex flex-col border-0 shadow-md rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Similar Implementations
        </h3>

        <ScrollArea className="pr-3 mb-2 h-[1050px]">
          <div className="space-y-4">
            {results.map((result) => (
              <Card
                key={result.path}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-200 bg-gray-100 text-gray-800 rounded-lg border-0 shadow-none ${
                  selectedResult === result.path
                    ? 'bg-green-100 border-green-200'
                    : ''
                }`}
                onClick={() => setSelectedResult(result.path)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className="font-medium text-base truncate"
                        title={result.name}
                      >
                        {result.name}
                      </h4>
                      <Badge
                        className={`${
                          result.analysis.overallScore >= 80
                            ? 'bg-green-500'
                            : result.analysis.overallScore >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        } text-white`}
                      >
                        {result.analysis.overallScore}/100
                      </Badge>
                    </div>
                    <p
                      className="text-sm text-gray-500 truncate"
                      title={result.path}
                    >
                      {result.path}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center text-sm space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>{result.repository.stars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <GitFork className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{result.repository.forks.toLocaleString()}</span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal text-gray-800 bg-white border-gray-300"
                    >
                      {result.repository.language || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3">
                  <a
                    href={`${result.repository.url}/blob/master/${result.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on GitHub
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Code comparison and analysis - expanded width */}
      <div className="lg:col-span-5 space-y-6">
        {currentResult && (
          <>
            <Card className="p-4 bg-white border-0 shadow-md rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {currentResult.repository.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentResult.repository.full_name} - {currentResult.path}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="font-normal text-gray-800 bg-white"
                    >
                      {currentResult.repository.language || 'Unknown'}
                    </Badge>
                    <Badge
                      className={`${
                        currentResult.analysis.overallScore >= 80
                          ? 'bg-green-500'
                          : currentResult.analysis.overallScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      } text-white`}
                    >
                      Quality Score: {currentResult.analysis.overallScore}/100
                    </Badge>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="comparison">
                <TabsList className="grid grid-cols-2 mb-4 bg-white p-0 bg-transparent shadow-none">
                  <TabsTrigger 
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-800 font-medium py-3 transition-all flex items-center justify-center" 
                    value="comparison"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6m-6 18h6m-11-9h16M9 3v18m6-18v18" />
                    </svg>
                    Side-by-Side Comparison
                  </TabsTrigger>
                  <TabsTrigger 
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-800 font-medium py-3 transition-all flex items-center justify-center" 
                    value="insights"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Implementation Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="mt-0 h-[850px]">
                  <MonacoDiffViewer
                    originalCode={originalCode}
                    modifiedCode={currentResult.codeContent}
                    language={detectLanguage(currentResult.name)}
                    height="800px"
                    filename={currentResult.name}
                  />
                </TabsContent>

                <TabsContent
                  value="insights"
                  className="mt-0 h-[850px] overflow-auto"
                >
                  <Card className="overflow-hidden rounded-lg bg-white h-full flex flex-col border-0 shadow-md">
                    {/* Code analysis header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                      <h3 className="text-lg font-medium">Code Analysis</h3>
                      <p className="text-sm opacity-90 mt-1">
                        Detailed insights for {currentResult.name}
                      </p>
                    </div>

                    {/* Analysis sections */}
                    <div className="flex-1 flex flex-col">
                      {/* Overview section */}
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center mb-3 text-blue-700">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold">Overview</h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.insights}
                          </div>
                        </div>
                      </div>

                      {/* Technical Analysis section */}
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center mb-3 text-purple-700">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="16 18 22 12 16 6" />
                              <polyline points="8 6 2 12 8 18" />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold">
                            Technical Analysis
                          </h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.technicalAnalysis}
                          </div>
                        </div>
                      </div>

                      {/* Best Practices section */}
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center mb-3 text-amber-700">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path d="M2 17l10 5 10-5" />
                              <path d="M2 12l10 5 10-5" />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold">
                            Best Practices
                          </h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.bestPractices}
                          </div>
                        </div>
                      </div>

                      {/* Improvement Areas section - with flex-grow to fill remaining space */}
                      <div className="p-5 flex-grow">
                        <div className="flex items-center mb-3 text-red-700">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold">
                            Improvement Areas
                          </h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.improvementAreas ||
                              'No specific improvement areas identified.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="p-4 bg-white border-0 shadow-md rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg 
                    className="w-5 h-5 mr-2 text-indigo-500" 
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
                  Repository Details
                </h3>
              </div>
              
              <p className="text-sm mb-4 text-gray-700 bg-indigo-50 p-3 rounded-md">
                {currentResult.repository.description || 'No description available for this repository.'}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <div className="rounded-full bg-yellow-100 p-1.5 mr-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Stars</h4>
                      <p className="font-mono font-medium text-gray-800">
                        {currentResult.repository.stars.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-100 p-1.5 mr-2">
                      <GitFork className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Forks</h4>
                      <p className="font-mono font-medium text-gray-800">
                        {currentResult.repository.forks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="rounded-full bg-indigo-100 p-1.5 mr-2">
                      <svg 
                        className="h-4 w-4 text-indigo-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Language</h4>
                      <p className="font-medium text-gray-800">
                        {currentResult.repository.language || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                <a
                  href={currentResult.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View on GitHub
                </a>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
