"use client";

import React, { useRef, useEffect, useState } from "react";
import { loadMonaco, createDefaultDiffEditorOptions } from "@/lib/monaco-config";
import type * as Monaco from "monaco-editor";
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
  const [monacoInstance, setMonacoInstance] = useState<typeof Monaco | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  
  // Use refs instead of state for editor and models to avoid re-renders
  const diffEditorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const originalModelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const isMountedRef = useRef(true);

  // Handle client-side only code
  useEffect(() => {
    setIsMounted(true);
    isMountedRef.current = true;
    
    // Load Monaco singleton instance
    const initMonaco = async () => {
      try {
        const monaco = await loadMonaco();
        if (monaco && isMountedRef.current) {
          setMonacoInstance(monaco);
        }
      } catch (err) {
        console.error("Failed to load Monaco:", err);
      }
    };
    
    initMonaco();
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      
      // Cleanup in correct order
      if (diffEditorRef.current) {
        diffEditorRef.current.dispose();
        diffEditorRef.current = null;
      }
      
      if (originalModelRef.current) {
        originalModelRef.current.dispose();
        originalModelRef.current = null;
      }
      
      if (modifiedModelRef.current) {
        modifiedModelRef.current.dispose();
        modifiedModelRef.current = null;
      }
    };
  }, []);

  // Set up Monaco diff editor when Monaco is loaded or props change
  useEffect(() => {
    if (!monacoInstance || !containerRef.current || !isMounted) return;
    
    // Clean up previous instances first
    if (diffEditorRef.current) {
      diffEditorRef.current.dispose();
      diffEditorRef.current = null;
    }
    
    if (originalModelRef.current) {
      originalModelRef.current.dispose();
      originalModelRef.current = null;
    }
    
    if (modifiedModelRef.current) {
      modifiedModelRef.current.dispose();
      modifiedModelRef.current = null;
    }
    
    // Double check container ref exists and component is still mounted
    if (!containerRef.current || !isMountedRef.current) return;
    
    try {
      // Create models for original and modified code
      originalModelRef.current = monacoInstance.editor.createModel(originalCode, language);
      modifiedModelRef.current = monacoInstance.editor.createModel(modifiedCode, language);
      
      // Create options using our utility function
      const options = createDefaultDiffEditorOptions({
        readOnly: true,
        contextmenu: false,
        diffWordWrap: 'off',
        guides: {
          indentation: true
        }
      });
      
      // Create diff editor
      diffEditorRef.current = monacoInstance.editor.createDiffEditor(containerRef.current, options);
      
      // Only set the models if component is still mounted
      if (isMountedRef.current && diffEditorRef.current && originalModelRef.current && modifiedModelRef.current) {
        diffEditorRef.current.setModel({
          original: originalModelRef.current,
          modified: modifiedModelRef.current,
        });
      }
    } catch (err) {
      console.error("Error creating Monaco diff editor:", err);
    }
    
    // Clean up function
    return () => {
      // Clean up in correct order
      if (diffEditorRef.current) {
        diffEditorRef.current.dispose();
        diffEditorRef.current = null;
      }
      
      if (originalModelRef.current) {
        originalModelRef.current.dispose();
        originalModelRef.current = null;
      }
      
      if (modifiedModelRef.current) {
        modifiedModelRef.current.dispose();
        modifiedModelRef.current = null;
      }
    };
  }, [monacoInstance, isMounted, originalCode, modifiedCode, language, isDarkTheme]);

  // Update theme when it changes
  useEffect(() => {
    if (monacoInstance?.editor && isMountedRef.current) {
      monacoInstance.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    }
  }, [isDarkTheme, monacoInstance]);

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
        data-testid="monaco-diff-container"
      />
    </Card>
  );
}

export default MonacoDiffViewer;
