"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Copy, Check, FileIcon } from "lucide-react";
import { codeToHtml } from "shiki";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  lightTheme?: string;
  darkTheme?: string;
  showLineNumbers?: boolean;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
];

export function CodeEditor({
  code: initialCode,
  language = "typescript",
  onChange,
  readOnly = false,
  lightTheme = "github-light",
  darkTheme = "github-dark",
  showLineNumbers = true,
  className,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [highlightedCode, setHighlightedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const { theme, systemTheme } = useTheme();
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const lines = code.split("\n");
    setLineCount(lines.length);
  }, [code]);

  useEffect(() => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    const selectedTheme = currentTheme === "dark" ? darkTheme : lightTheme;

    async function highlightCode() {
      try {
        const highlighted = await codeToHtml(code, {
          lang: selectedLanguage,
          theme: selectedTheme,
        });
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(`<pre>${code}</pre>`);
      }
    }

    highlightCode();
  }, [code, theme, systemTheme, selectedLanguage, lightTheme, darkTheme]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange?.(newCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  return (
    <Card className={cn("border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue={readOnly ? "preview" : "edit"} className="w-full">
        <TabsList className="grid grid-cols-2 bg-accent border-b border-border rounded-none">
          <TabsTrigger value="edit" disabled={readOnly}>
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="relative">
          <div className="flex">
            {showLineNumbers && (
              <div className="text-xs font-mono p-4 text-muted-foreground bg-muted w-10 text-right select-none border-r border-border">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="font-mono text-sm p-4 bg-background text-foreground w-full outline-none resize-none min-h-[300px]"
              disabled={readOnly}
              spellCheck="false"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="relative">
          <div className="flex">
            {showLineNumbers && (
              <div className="text-xs font-mono p-4 text-muted-foreground bg-muted w-10 text-right select-none border-r border-border">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <div
              className="w-full overflow-auto bg-background font-mono text-sm [&>pre]:!bg-transparent [&>pre]:p-4 [&_code]:break-all"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default CodeEditor;
