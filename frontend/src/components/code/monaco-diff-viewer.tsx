"use client";

import React, { useRef, useEffect, useState } from "react";
import { loadMonaco, createDefaultEditorOptions } from "@/lib/monaco-config";
import type * as Monaco from "monaco-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, Maximize2, Minimize2 } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [monacoInstance, setMonacoInstance] = useState<typeof Monaco | null>(null);
  const originalContainerRef = useRef<HTMLDivElement>(null);
  const modifiedContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  
  // Use refs for editors and models to avoid re-renders
  const originalEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const modifiedEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
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
      
      // Dispose editors and models
      if (originalEditorRef.current) {
        originalEditorRef.current.dispose();
        originalEditorRef.current = null;
      }
      
      if (modifiedEditorRef.current) {
        modifiedEditorRef.current.dispose();
        modifiedEditorRef.current = null;
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

  // Explicitly depend on expanded state to recreate editors when toggling
  useEffect(() => {
    // In expanded mode, we only need the modifiedContainerRef
    if (!monacoInstance || !modifiedContainerRef.current || !isMounted) return;
    if (!expanded && !originalContainerRef.current) return; // Need originalContainerRef in non-expanded mode
    
    // Store current code from models before disposing
    let savedOriginalCode = originalCode;
    let savedModifiedCode = modifiedCode;
    
    if (originalModelRef.current) {
      try {
        savedOriginalCode = originalModelRef.current.getValue();
      } catch (e) {
        console.error("Failed to get original editor value", e);
      }
    }
    
    if (modifiedModelRef.current) {
      try {
        savedModifiedCode = modifiedModelRef.current.getValue();
      } catch (e) {
        console.error("Failed to get modified editor value", e);
      }
    }
    
    // Using setTimeout to ensure DOM has fully rendered
    setTimeout(() => {
      if (!isMountedRef.current || !modifiedContainerRef.current) return;
      if (!expanded && !originalContainerRef.current) return;
      
      // Clean up previous instances
      if (originalEditorRef.current) {
        originalEditorRef.current.dispose();
        originalEditorRef.current = null;
      }
      
      if (modifiedEditorRef.current) {
        modifiedEditorRef.current.dispose();
        modifiedEditorRef.current = null;
      }
      
      if (originalModelRef.current) {
        originalModelRef.current.dispose();
        originalModelRef.current = null;
      }
      
      if (modifiedModelRef.current) {
        modifiedModelRef.current.dispose();
        modifiedModelRef.current = null;
      }
      
      try {
        // Prepare safe code values
        const safeOriginalCode = originalCode || '// No original code provided';
        const safeModifiedCode = modifiedCode || '// No modified code provided';
        
        // Set theme
        monacoInstance.editor.setTheme("vs-light");
        
        // Create common editor options
        const baseOptions = createDefaultEditorOptions({
          readOnly: true,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          contextmenu: false,
          fontSize: 14,
          fontFamily: "'Geist Mono', monospace, Consolas, 'Courier New', monospace",
          renderLineHighlight: 'all',
          renderWhitespace: 'all',
          scrollbar: { vertical: 'visible', horizontal: 'visible' },
        });
        
        // Create models with specific language - use saved values if available
        originalModelRef.current = monacoInstance.editor.createModel(
          savedOriginalCode || safeOriginalCode, 
          language
        );
        
        modifiedModelRef.current = monacoInstance.editor.createModel(
          savedModifiedCode || safeModifiedCode, 
          language
        );
        
        // Create editors - only create original editor if not in expanded mode
        if (!expanded && originalContainerRef.current) {
          originalEditorRef.current = monacoInstance.editor.create(
            originalContainerRef.current, 
            { ...baseOptions, glyphMargin: true, model: originalModelRef.current }
          );
        }
        
        modifiedEditorRef.current = monacoInstance.editor.create(
          modifiedContainerRef.current, 
          { ...baseOptions, glyphMargin: true, model: modifiedModelRef.current }
        );
        
        // Synchronize scrolling between editors (only if both editors exist)
        if (!expanded && originalEditorRef.current && modifiedEditorRef.current) {
          const originalEditor = originalEditorRef.current;
          const modifiedEditor = modifiedEditorRef.current;
          
          // Sync vertical scrolling
          originalEditor.onDidScrollChange(e => {
            if (e.scrollTop !== undefined) {
              modifiedEditor.setScrollTop(e.scrollTop);
            }
          });
          
          modifiedEditor.onDidScrollChange(e => {
            if (e.scrollTop !== undefined) {
              originalEditor.setScrollTop(e.scrollTop);
            }
          });
        }
        
      } catch (err) {
        console.error("Error creating Monaco editors:", err);
      }
    }, 0);
    
    // Clean up
    return () => {
      if (originalEditorRef.current) {
        originalEditorRef.current.dispose();
        originalEditorRef.current = null;
      }
      
      if (modifiedEditorRef.current) {
        modifiedEditorRef.current.dispose();
        modifiedEditorRef.current = null;
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
  }, [monacoInstance, isMounted, originalCode, modifiedCode, language, isDarkTheme, height]);

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
              {originalCode ? originalCode.substring(0, 100) + (originalCode.length > 100 ? '...' : '') : 'Loading...'}
            </pre>
          </div>
          <div className="flex-1 p-4">
            <pre className="text-xs opacity-50 font-mono">
              {modifiedCode ? modifiedCode.substring(0, 100) + (modifiedCode.length > 100 ? '...' : '') : 'Loading...'}
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
          {!expanded && (
            <span className="text-xs font-medium text-blue-800">Original</span>
          )}
          <span className="text-xs font-medium text-blue-800">Modified</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-blue-600"
            onClick={() => {
              setExpanded(!expanded);
              // Force re-layout on next tick after DOM updates
              setTimeout(() => {
                if (originalEditorRef.current) originalEditorRef.current.layout();
                if (modifiedEditorRef.current) modifiedEditorRef.current.layout();
              }, 0);
            }}
            title={expanded ? "Show both panels" : "Show only modified code"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex w-full" style={{ height }}>
        {!expanded && (
          <div 
            ref={originalContainerRef}
            className="w-1/2 border-r border-gray-200" 
            data-testid="monaco-original-container"
          />
        )}
        <div 
          ref={modifiedContainerRef}
          className={expanded ? "w-full" : "w-1/2"} 
          data-testid="monaco-modified-container"
        />
      </div>
    </Card>
  );
}

export default MonacoDiffViewer;
