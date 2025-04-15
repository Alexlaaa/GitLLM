"use client";

import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MonacoCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  height?: string;
  showLineNumbers?: boolean;
  title?: string;
}

export function MonacoCodeBlock({
  code,
  language = "typescript",
  className,
  height = "auto",
  showLineNumbers = true,
  title,
}: MonacoCodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  
  // Calculate dynamic height based on content
  const calculateHeight = () => {
    const lineCount = code.split('\n').length;
    const lineHeight = 19; // Approximate line height in pixels
    const paddingHeight = 20; // Additional padding
    return Math.min(500, lineCount * lineHeight + paddingHeight); // Cap at 500px
  };

  const dynamicHeight = height === "auto" ? `${calculateHeight()}px` : height;

  // Set up Monaco editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure editor options
    const options: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: code,
      language,
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: showLineNumbers ? "on" : "off",
      renderLineHighlight: "all",
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
      theme: isDarkTheme ? "vs-dark" : "vs-light",
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace",
      automaticLayout: true,
      contextmenu: false,
      folding: true,
      guides: {
        indentation: true
      }
    };

    // Create editor
    const editor = monaco.editor.create(containerRef.current, options);
    editorRef.current = editor;

    // Clean up on unmount
    return () => {
      editor.dispose();
    };
  }, [code, language, showLineNumbers, isDarkTheme]);

  // Update theme when it changes
  useEffect(() => {
    monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
  }, [isDarkTheme]);

  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn("border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {title || language}
          </span>
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
        ref={containerRef}
        style={{ height: dynamicHeight }}
        className="w-full"
      />
    </Card>
  );
}

export default MonacoCodeBlock;
