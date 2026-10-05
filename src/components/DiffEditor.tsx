"use client";

import React, { useRef, useMemo } from "react";
import {
  Clipboard,
  Sparkles,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Minimize2,
} from "lucide-react";
import { validateJSON } from "@/lib/diffEngine";

interface DiffEditorProps {
  title: string;
  badgeText: string;
  badgeType: "dev" | "stage";
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const DiffEditor: React.FC<DiffEditorProps> = ({
  title,
  badgeText,
  badgeType,
  value,
  onChange,
  placeholder = "Paste JSON response here...",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validation
  const validation = useMemo(() => {
    if (!value || !value.trim()) {
      return { isEmpty: true, isValid: false, error: null };
    }
    const res = validateJSON(value);
    return {
      isEmpty: false,
      isValid: res.isValid,
      error: res.error,
      line: res.line,
      column: res.column,
      lineCount: value.split("\n").length,
    };
  }, [value]);

  // Format JSON
  const handleFormat = () => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {}
  };

  // Minify JSON
  const handleMinify = () => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
    } catch {}
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) onChange(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const badgeClass =
    badgeType === "dev"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded-md border ${badgeClass}`}
          >
            {badgeText}
          </span>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>

        {/* Validation Status */}
        <div>
          {validation.isEmpty ? (
            <span className="text-xs text-slate-400">Empty</span>
          ) : validation.isValid ? (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Valid JSON ({validation.lineCount} lines)</span>
            </div>
          ) : (
            <div
              title={validation.error || "Syntax Error"}
              className="flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md max-w-[200px] truncate"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span className="truncate">
                {validation.line ? `Error Line ${validation.line}` : "Invalid JSON"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-slate-600" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={handleFormat}
            disabled={!validation.isValid}
            className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors font-medium"
            title="Format / Prettify JSON"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleMinify}
            disabled={!validation.isValid}
            className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors font-medium"
            title="Minify JSON"
          >
            <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Minify</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md transition-colors font-medium"
            title="Upload .json file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Clear payload"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Code Textarea Area */}
      <div className="relative flex-1 min-h-[260px] flex bg-slate-50/30">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs sm:text-sm text-slate-800 bg-transparent resize-y outline-none leading-relaxed placeholder:text-slate-400"
          rows={14}
        />
      </div>

      {/* Error message */}
      {validation.error && !validation.isEmpty && (
        <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs font-mono">
          <span className="font-semibold font-sans">Error: </span>
          {validation.error}
        </div>
      )}
    </div>
  );
};
