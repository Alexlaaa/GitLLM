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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-800">
      {/* Similar implementations list */}
      <Card className="p-4 lg:col-span-1 bg-white">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Similar Implementations
        </h3>

        <ScrollArea className="h-[660px] pr-3">
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
                  <Badge
                    variant="outline"
                    className="text-xs font-normal text-gray-800 bg-white border-gray-300"
                  >
                    {result.analysis.similarityScore}% match
                  </Badge>
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

      {/* Code comparison and analysis */}
      <div className="lg:col-span-2 space-y-6">
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
                  <Badge
                    variant="outline"
                    className="font-normal text-gray-800 bg-white border-gray-300"
                  >
                    {currentResult.analysis.similarityScore}% Similar
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
                    height="400px"
                    filename={currentResult.name}
                  />
                </TabsContent>

                <TabsContent value="insights" className="mt-0">
                  <Card className="p-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="font-semibold text-base">Analysis</h4>
                      <p className="text-sm whitespace-pre-line mt-2">
                        {currentResult.analysis.insights}
                      </p>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-semibold text-base">
                        Key Differences
                      </h4>
                      <ul className="mt-2 text-sm space-y-2">
                        {currentResult.analysis.highlightedDifferences.map(
                          (diff, index) => (
                            <li key={index} className="flex">
                              <FileCode className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                              <span>{diff}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="mt-6 bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                      <h4 className="font-semibold text-base">
                        Implementation Quality
                      </h4>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${currentResult.analysis.similarityScore}%`,
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {currentResult.analysis.similarityScore}%
                        </span>
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
