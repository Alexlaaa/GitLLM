'use client';

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
          <Card className="p-6 pb-5 bg-white border h-[700px] flex flex-col">
            {' '}
            {/* Added light background */}
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Code Pattern
            </h2>
            <p className="text-gray-500 mb-4">
              Enter a code pattern or snippet to find similar implementations
              across GitHub repositories
            </p>
            {/* Increased height for better code input */}
            <div className="mb-8 h-[550px]">
              <MonacoEditor
                value={code}
                onChange={setCode}
                language={language || 'javascript'}
                height="500px"
              />
            </div>
            {/* Added top margin to prevent overlap */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-end mt-12">
              {/* Removed redundant language select div */}

              <Button
                className="w-full md:w-auto"
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
          </Card>
        </div>

        <Card className="p-6 bg-white border h-[700px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Search Refinement
          </h2>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-4 border border-gray-200 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="text-gray-900">Additional Filters</span>
              {showFilters ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">
                  Repository Filter
                </label>
                <Input
                  value={repoFilter}
                  onChange={(e) => setRepoFilter(e.target.value)}
                  placeholder="owner/repo (e.g., facebook/react)"
                  className="text-gray-800 placeholder:text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format must be exactly "owner/repo" with no spaces
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">
                  User/Organization
                </label>
                <Input
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="e.g., facebook"
                  className="text-gray-800 placeholder:text-gray-500"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-6 p-4 bg-blue-50 rounded-md flex">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              For best results, provide a small but representative code snippet
              that captures the pattern you're interested in. More specific,
              focused patterns yield better comparisons.
            </p>
          </div>
          
        </Card>
      </div>
    </div>
  );
}
