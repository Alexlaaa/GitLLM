"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export interface MonacoCodeBlockProps {
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
  const [isMounted, setIsMounted] = useState(false);
  // Use more specific types instead of any
  const [monaco, setMonaco] = useState<typeof import('monaco-editor') | null>(null);
  const [editor, setEditor] = useState<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Handle client-side only code
  useEffect(() => {
    setIsMounted(true);
    // Dynamically import Monaco Editor only on client side
    const loadMonaco = async () => {
      try {
        const monacoModule = await import('monaco-editor');
        setMonaco(monacoModule);
      } catch (err) {
        console.error("Failed to load Monaco:", err);
      }
    };
    
    // Define MonacoEnvironment for worker loading
    if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
      window.MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
          // NOTE: Assumes worker files are copied to public/monaco-workers/vs/...
          // via next.config.mjs CopyPlugin configuration.
          const workerBasePath = '/monaco-workers/vs';
          if (label === 'json') {
            return `${workerBasePath}/language/json/json.worker.js`;
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return `${workerBasePath}/language/css/css.worker.js`;
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return `${workerBasePath}/language/html/html.worker.js`;
          }
          if (label === 'typescript' || label === 'javascript') {
            return `${workerBasePath}/language/typescript/ts.worker.js`;
          }
          // Default worker
          return `${workerBasePath}/editor/editor.worker.js`; // Adjusted default worker path
        },
      };
    }
    
    loadMonaco();
    
  }, []); // Empty dependency array ensures this runs only once on mount

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
    if (!monaco || !containerRef.current || !isMounted) return;
    
    // Configure editor options
    const options: import('monaco-editor').editor.IStandaloneEditorConstructionOptions = {
      value: code,
      language,
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: showLineNumbers ? 'on' as const : 'off' as const,
      renderLineHighlight: 'all',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
      theme: isDarkTheme ? 'vs-dark' : 'vs-light',
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace",
      automaticLayout: true,
      contextmenu: false,
      folding: true,
      guides: {
        indentation: true
      }
    };

    try {
      // Clean up previous instance if it exists
      if (editor) {
        editor.dispose();
      }
      
      // Create editor
      const newEditor = monaco.editor.create(containerRef.current, options);
      setEditor(newEditor);
    } catch (err) {
      console.error("Error creating Monaco editor:", err);
    }
    
    return () => {
      if (editor) editor.dispose();
    };
    // Ensure editor is disposed on component unmount or when dependencies change significantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, isMounted, code, language, showLineNumbers, isDarkTheme, dynamicHeight]); // Added dynamicHeight dependency

  // Update theme when it changes
  useEffect(() => {
    if (monaco?.editor) {
      monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    }
  }, [isDarkTheme, monaco]);

  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If we're in SSR or haven't loaded Monaco yet, return a placeholder
  if (!isMounted) {
    return (
      <Card className={cn("border border-border overflow-hidden", className)}>
        <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title || language}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        <div style={{ height: dynamicHeight }} className="w-full bg-muted/20">
          <pre className="p-4 text-xs opacity-50 font-mono overflow-x-auto">
            {code.substring(0, 100)}
            {code.length > 100 ? '...' : ''}
          </pre>
        </div>
      </Card>
    );
  }

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
