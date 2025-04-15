import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonacoEditor } from '@/components/code/monaco-editor';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import { CodePattern } from './pattern-analyzer-interface';

interface CodePatternInputProps {
  onSubmit: (pattern: CodePattern) => void;
  isLoading: boolean;
}

// List of programming languages to choose from
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

export default function CodePatternInput({
  onSubmit,
  isLoading,
}: CodePatternInputProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [repoFilter, setRepoFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) return;

    const filters = {
      ...(repoFilter ? { repoFilter } : {}),
      ...(userFilter ? { userFilter } : {}),
    };

    onSubmit({
      code,
      language,
      filters,
    });
  };

  return (
    <div className="space-y-6 text-gray-800">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6 pb-5 bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-sm h-[700px] flex flex-col rounded-xl">
            <h2 className="text-xl font-semibold mb-5 text-gray-900 flex items-center">
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Code Pattern
            </h2>
            <p className="text-gray-600 mb-4 flex items-start">
              <svg
                className="w-4 h-4 mr-1 mt-0.5 text-gray-400"
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
              <span>
                Enter a code pattern or snippet to find similar implementations
                across GitHub repositories
              </span>
            </p>
            {/* Reduced height to ensure everything fits within container */}
            <div className="mb-2 h-[480px]">
              <MonacoEditor
                value={code}
                onChange={setCode}
                language={language || 'javascript'}
                height="480px"
              />
            </div>
            {/* Fixed position button at bottom of container with reduced padding */}
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-end">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  onClick={handleSubmit}
                  disabled={isLoading || !code.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Find Similar Implementations'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-sm h-[700px] flex flex-col rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900 flex items-center">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Search Refinement
          </h2>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-5 border border-gray-200 p-3 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm">
              <span className="text-gray-900 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Additional Filters
              </span>
              {showFilters ? (
                <ChevronDown className="h-5 w-5 text-blue-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 px-1">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-sm font-medium mb-2 text-gray-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Repository Filter
                </label>
                <Input
                  value={repoFilter}
                  onChange={(e) => setRepoFilter(e.target.value)}
                  placeholder="owner/repo (e.g., facebook/react)"
                  className="text-gray-800 placeholder:text-gray-500 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1 text-gray-400"
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
                  Format must be exactly "owner/repo" with no spaces
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-sm font-medium mb-2 text-gray-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  User/Organization
                </label>
                <Input
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="e.g., facebook"
                  className="text-gray-800 placeholder:text-gray-500 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-auto mb-2">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Tips for Better Results
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Provide a small but representative code snippet that
                    captures the specific pattern you're interested in. More
                    focused queries yield better comparisons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
