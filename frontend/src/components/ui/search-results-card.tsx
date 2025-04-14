"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, ExternalLink, FileCode, GitBranch, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CodeSnippet {
  code: string;
  language: string;
  lineNumbers: number[];
}

interface Repository {
  name: string;
  owner: string;
  url: string;
  branch: string;
  stars: number;
}

interface SearchResult {
  id: string;
  repository: Repository;
  filePath: string;
  codeSnippet: CodeSnippet;
  matchScore: number;
  fullContext?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onFilterChange?: (filter: string) => void;
}

const SyntaxHighlighter: React.FC<{ code: string; language: string }> = ({
  code,
}) => {
  // Simple syntax highlighting for demonstration
  return (
    <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm">
      <code className="text-foreground font-mono">{code}</code>
    </pre>
  );
};

const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">
              {result.repository.owner}/{result.repository.name}
            </CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{result.matchScore.toFixed(1)}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{result.filePath}</span>
        </div>

        <div className="max-h-[150px] overflow-hidden relative">
          <SyntaxHighlighter
            code={result.codeSnippet.code}
            language={result.codeSnippet.language}
          />
          {!isOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>
      </CardContent>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardFooter className="pt-2 pb-4 flex justify-center">
            <Button variant="ghost" size="sm" className="text-xs">
              {isOpen ? "Show Less" : "Show More"}
            </Button>
          </CardFooter>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="my-2" />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Full Context</h4>
                <SyntaxHighlighter
                  code={result.fullContext || result.codeSnippet.code}
                  language={result.codeSnippet.language}
                />
              </div>

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
                    href={result.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Repository
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const SearchResultsFilter: React.FC<{
  onFilterChange: (filter: string) => void;
}> = ({ onFilterChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Filter results..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFilterChange(e.target.value)
          }
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Select defaultValue="relevance">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Sort by Relevance</SelectItem>
            <SelectItem value="stars">Sort by Stars</SelectItem>
            <SelectItem value="recent">Sort by Recent</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export function SearchResults({
  results,
  onFilterChange = () => {},
}: SearchResultsProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <SearchResultsFilter onFilterChange={onFilterChange} />

      <AnimatePresence>
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <SearchResultCard result={result} />
          </motion.div>
        ))}
      </AnimatePresence>

      {results.length === 0 && (
        <div className="text-center py-12">
          <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium">No results found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
