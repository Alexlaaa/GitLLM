"use client";

import React, { useRef, useEffect, useState } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MonacoEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
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

export function MonacoEditor({
  value: initialValue,
  language = "typescript",
  onChange,
  readOnly = false,
  className,
  height = "300px",
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Set up Monaco editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Configure editor
    const editor = monaco.editor.create(editorRef.current, {
      value: initialValue,
      language: selectedLanguage,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      readOnly,
      theme: isDarkTheme ? "vs-dark" : "vs-light",
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace",
      lineNumbers: "on",
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
      },
      roundedSelection: true,
      renderLineHighlight: "all",
    });

    // Set up event listeners
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
    });

    // Update editor theme when theme changes
    monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    
    // Store editor reference
    monacoEditorRef.current = editor;

    // Clean up on unmount
    return () => {
      editor.dispose();
    };
  }, [initialValue, isDarkTheme]);

  // Update editor language when language changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setModelLanguage(
        monacoEditorRef.current.getModel()!,
        selectedLanguage
      );
    }
  }, [selectedLanguage]);

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  // Copy code to clipboard
  const copyToClipboard = () => {
    if (monacoEditorRef.current) {
      const code = monacoEditorRef.current.getValue();
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      
      <div 
        ref={editorRef}
        style={{ height }}
        className="w-full"
      />
    </Card>
  );
}

export default MonacoEditor;
