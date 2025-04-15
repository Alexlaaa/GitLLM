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
      <Card className="p-4 lg:col-span-1 bg-white h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Similar Implementations
        </h3>

        <ScrollArea className="pr-3 mb-2 h-[900px]">
          <div className="space-y-4">
            {results.map((result) => (
              <Card
                key={result.path}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-100 bg-white text-gray-800 ${
                  selectedResult === result.path
                    ? 'border-primary/50 bg-gray-100'
                    : ''
                }`}
                onClick={() => setSelectedResult(result.path)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className="font-medium text-base truncate"
                      title={result.name}
                    >
                      {result.name}
                    </h4>
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
            <Card className="p-4 bg-white">
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
                  <Badge
                    variant="outline"
                    className="font-normal text-gray-800 bg-white"
                  >
                    {currentResult.repository.language || 'Unknown'}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="comparison">
                <TabsList className="mb-4 bg-gray-100">
                  <TabsTrigger value="comparison">
                    Side-by-Side Comparison
                  </TabsTrigger>
                  <TabsTrigger value="insights">
                    Implementation Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="mt-0">
                  <MonacoDiffViewer
                    originalCode={originalCode}
                    modifiedCode={currentResult.codeContent}
                    language={detectLanguage(currentResult.name)}
                    height="800px"
                    filename={currentResult.name}
                  />
                </TabsContent>

                <TabsContent value="insights" className="mt-0">
                  <Card className="p-0 overflow-hidden rounded-lg shadow-sm bg-white">
                    {/* Code analysis header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                      <h3 className="text-lg font-medium">Code Analysis</h3>
                      <p className="text-sm opacity-90 mt-1">
                        Detailed insights for {currentResult.name}
                      </p>
                    </div>

                    {/* Analysis sections */}
                    <div className="grid gap-1 p-1">
                      {/* Overview section */}
                      <div className="p-4">
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
                          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.insights}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Technical Details section */}
                      <div className="p-4">
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
                            Technical Details
                          </h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/30 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.technicalDetails}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Implementation Approach section */}
                      <div className="p-4">
                        <div className="flex items-center mb-3 text-emerald-700">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
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
                              <rect
                                x="2"
                                y="3"
                                width="20"
                                height="14"
                                rx="2"
                                ry="2"
                              />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold">
                            Implementation Approach
                          </h4>
                        </div>
                        <div className="pl-11">
                          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.implementationApproach}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Best Practices section */}
                      <div className="p-4">
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
                        <div className="pl-11 pb-2">
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200 text-sm leading-relaxed text-gray-700">
                            {currentResult.analysis.bestPractices}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Improvement Areas section */}
                      <div className="p-4">
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
                        <div className="pl-11 pb-2">
                          <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200 text-sm leading-relaxed text-gray-700">
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

            <Card className="p-4 bg-white">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                Repository Details
              </h3>
              <p className="text-sm mb-4 text-gray-700">
                {currentResult.repository.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Stars</h4>
                  <p className="font-mono text-gray-800">
                    {currentResult.repository.stars.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Forks</h4>
                  <p className="font-mono text-gray-800">
                    {currentResult.repository.forks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Language
                  </h4>
                  <p className="text-gray-800">
                    {currentResult.repository.language || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">GitHub</h4>
                  <a
                    href={currentResult.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center text-sm"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Repository
                  </a>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
