"use client";

import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonacoDiffViewerProps {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Set up Monaco diff editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Set the theme globally
    monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    
    // Configure editor options
    const options: monaco.editor.IDiffEditorConstructionOptions = {
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderSideBySide: true,
      fontSize: 14,
      fontFamily: "'Geist Mono', monospace",
      automaticLayout: true,
      contextmenu: false,
      folding: true,
      lineNumbers: "on",
      diffWordWrap: "off",
      renderOverviewRuler: false,
      guides: {
        indentation: true
      }
    };

    // Create diff editor
    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, options);
    
    // Set the editor models
    const originalModel = monaco.editor.createModel(originalCode, language);
    const modifiedModel = monaco.editor.createModel(modifiedCode, language);
    
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    
    diffEditorRef.current = diffEditor;

    // Clean up on unmount
    return () => {
      diffEditor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
    };
  }, [originalCode, modifiedCode, language, isDarkTheme]);

  // Update theme when it changes
  useEffect(() => {
    monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
  }, [isDarkTheme]);

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
