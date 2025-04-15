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
  const [monaco, setMonaco] = useState<typeof Monaco | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftEditorRef = useRef<HTMLDivElement>(null);
  const rightEditorRef = useRef<HTMLDivElement>(null);
  
  const leftEditorInstanceRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const rightEditorInstanceRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Load Monaco on client side
  useEffect(() => {
    const loadEditor = async () => {
      try {
        const monacoInstance = await loadMonaco();
        setMonaco(monacoInstance);
        setIsMounted(true);
      } catch (err) {
        console.error("Failed to load Monaco:", err);
      }
    };
    
    loadEditor();
    
    return () => {
      // Clean up editors when component unmounts
      if (leftEditorInstanceRef.current) {
        leftEditorInstanceRef.current.dispose();
      }
      if (rightEditorInstanceRef.current) {
        rightEditorInstanceRef.current.dispose();
      }
    };
  }, []);

  // Initialize editors once monaco is loaded
  useEffect(() => {
    if (!monaco || !leftEditorRef.current || !rightEditorRef.current) {
      return;
    }
    
    // Create editor options
    const options = createDefaultEditorOptions({
      readOnly: true,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace, Consolas, 'Courier New', monospace",
    });
    
    // Always use light theme for consistency
    monaco.editor.setTheme("vs-light");
    
    // Create editors if they don't exist
    if (!leftEditorInstanceRef.current) {
      leftEditorInstanceRef.current = monaco.editor.create(leftEditorRef.current, {
        ...options,
        value: originalCode || "// No original code",
        language: language,
      });
    }
    
    if (!rightEditorInstanceRef.current) {
      rightEditorInstanceRef.current = monaco.editor.create(rightEditorRef.current, {
        ...options,
        value: modifiedCode || "// No modified code",
        language: language,
      });
    }
    
    // Update the editor contents when props change
    leftEditorInstanceRef.current.setValue(originalCode || "// No original code");
    rightEditorInstanceRef.current.setValue(modifiedCode || "// No modified code");
    
    // Synchronize scrolling between editors
    const syncScrolling = () => {
      if (leftEditorInstanceRef.current && rightEditorInstanceRef.current) {
        leftEditorInstanceRef.current.onDidScrollChange(e => {
          if (rightEditorInstanceRef.current && e.scrollTop !== undefined) {
            rightEditorInstanceRef.current.setScrollTop(e.scrollTop);
          }
        });
        
        rightEditorInstanceRef.current.onDidScrollChange(e => {
          if (leftEditorInstanceRef.current && e.scrollTop !== undefined) {
            leftEditorInstanceRef.current.setScrollTop(e.scrollTop);
          }
        });
      }
    };
    
    syncScrolling();
    
    // Resize editors when container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (leftEditorInstanceRef.current) {
        leftEditorInstanceRef.current.layout();
      }
      if (rightEditorInstanceRef.current) {
        rightEditorInstanceRef.current.layout();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [monaco, originalCode, modifiedCode, language, isDarkTheme]);
  
  // Handle expanded state change
  useEffect(() => {
    if (!leftEditorInstanceRef.current || !rightEditorInstanceRef.current) {
      return;
    }
    
    // Update layout after DOM updates
    setTimeout(() => {
      if (leftEditorInstanceRef.current) {
        leftEditorInstanceRef.current.layout();
      }
      if (rightEditorInstanceRef.current) {
        rightEditorInstanceRef.current.layout();
      }
    }, 100);
  }, [expanded]);

  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  // Return a placeholder while Monaco is loading
  if (!isMounted) {
    return (
      <Card className={cn("border border-border overflow-hidden", className)}>
        <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{filename}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">Loading editors...</span>
          </div>
        </div>
        <div style={{ height }} className="w-full bg-muted/20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading code comparison...</p>
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
            onClick={toggleExpanded}
            title={expanded ? "Show both panels" : "Show only modified code"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex w-full"
        style={{ height }}
      >
        <div 
          ref={leftEditorRef}
          className={`border-r border-gray-200 transition-all duration-200 ${
            expanded ? 'w-0 overflow-hidden' : 'w-1/2'
          }`} 
          data-testid="monaco-original-container"
        />
        <div 
          ref={rightEditorRef}
          className={`transition-all duration-200 ${
            expanded ? 'w-full' : 'w-1/2'
          }`}
          data-testid="monaco-modified-container"
        />
      </div>
    </Card>
  );
}

export default MonacoDiffViewer;
