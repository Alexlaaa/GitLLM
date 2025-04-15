"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export interface MonacoDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  className?: string;
  height?: string;
  filename?: string;
}

export function MonacoDiffViewer({
  originalCode,
  modifiedCode,
  language = "typescript",
  className,
  height = "400px",
  filename = "Code Comparison",
}: MonacoDiffViewerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [monaco, setMonaco] = useState<typeof import('monaco-editor') | null>(null);
  const [diffEditor, setDiffEditor] = useState<import('monaco-editor').editor.IStandaloneDiffEditor | null>(null);
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
    
    loadMonaco();
  }, []);

  // Set up Monaco diff editor
  useEffect(() => {
    if (!monaco || !containerRef.current || !isMounted) return;
    
    // Clean up previous instance if it exists
    if (diffEditor) {
      diffEditor.dispose();
    }
    
    // Configure editor options
    const options: import('monaco-editor').editor.IDiffEditorConstructionOptions = {
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderSideBySide: true,
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace",
      automaticLayout: true,
      contextmenu: false,
      folding: true,
      lineNumbers: 'on' as const,
      diffWordWrap: 'off',
      renderOverviewRuler: false,
      guides: {
        indentation: true
      }
    };

    try {
      // Create diff editor
      const newDiffEditor = monaco.editor.createDiffEditor(containerRef.current, options);
      
      // Create models for original and modified code
      const originalModel = monaco.editor.createModel(originalCode, language);
      const modifiedModel = monaco.editor.createModel(modifiedCode, language);
      
      // Set the models
      newDiffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
      
      setDiffEditor(newDiffEditor);
      
      // Clean up models on unmount
      return () => {
        newDiffEditor.dispose();
        originalModel.dispose();
        modifiedModel.dispose();
      };
    } catch (err) {
      console.error("Error creating Monaco diff editor:", err);
      return () => {/* No cleanup needed */}
    }
  }, [monaco, isMounted, originalCode, modifiedCode, language, isDarkTheme]);

  // Update theme when it changes
  useEffect(() => {
    if (monaco?.editor) {
      monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    }
  }, [isDarkTheme, monaco]);

  // If we're in SSR or haven't loaded Monaco yet, return a placeholder
  if (!isMounted) {
    return (
      <Card className={cn("border border-border overflow-hidden", className)}>
        <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{filename}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">Original</span>
            <span className="text-xs text-muted-foreground">Modified</span>
          </div>
        </div>
        <div style={{ height }} className="w-full bg-muted/20 flex">
          <div className="flex-1 p-4 border-r border-border">
            <pre className="text-xs opacity-50 font-mono">
              {originalCode.substring(0, 100)}
              {originalCode.length > 100 ? '...' : ''}
            </pre>
          </div>
          <div className="flex-1 p-4">
            <pre className="text-xs opacity-50 font-mono">
              {modifiedCode.substring(0, 100)}
              {modifiedCode.length > 100 ? '...' : ''}
            </pre>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{filename}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-muted-foreground">Original</span>
          <span className="text-xs text-muted-foreground">Modified</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full"
      />
    </Card>
  );
}

export default MonacoDiffViewer;
