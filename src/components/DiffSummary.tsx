"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Code2,
  MinusCircle,
  PlusCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { DiffResult } from "@/lib/diffEngine";
import {
  generateQANote,
  generateTSVReport,
  generateMarkdownReport,
} from "@/lib/reportFormatter";

interface DiffSummaryProps {
  result: DiffResult;
  endpointName: string;
  onEndpointNameChange: (val: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const DiffSummary: React.FC<DiffSummaryProps> = ({
  result,
  endpointName,
  onEndpointNameChange,
}) => {
  const [activeTab, setActiveTab] = useState<"plain" | "tsv" | "markdown">("plain");
  const [copied, setCopied] = useState(false);

  // Formatted content
  const formattedContent = React.useMemo(() => {
    switch (activeTab) {
      case "plain":
        return generateQANote(result, endpointName);
      case "tsv":
        return generateTSVReport(result);
      case "markdown":
        return generateMarkdownReport(result, endpointName);
    }
  }, [result, endpointName, activeTab]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const ext = activeTab === "tsv" ? "tsv" : activeTab === "markdown" ? "md" : "txt";
    const filename = `api-diff-report-${Date.now()}.${ext}`;
    const blob = new Blob([formattedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Status Indicator Banner */}
      {result.isMatch ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-emerald-900">
                    MATCHED / OK
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-200/60 text-emerald-800">
                    0 Differences
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Both Dev and Stage payloads are functionally identical.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Note!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy QA Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-rose-200 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-rose-900">
                    MISMATCH DETECTED
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    {result.totalDifferences} Difference{result.totalDifferences === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Payload variations found between Dev and Stage environments.
                </p>
              </div>
            </div>

            {/* Difference breakdown counters */}
            <div className="flex flex-wrap items-center gap-2">
              {result.removedCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold">
                  <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>[-] {result.removedCount} Missing in Stage</span>
                </div>
              )}

              {result.addedCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>[+] {result.addedCount} Extra in Stage</span>
                </div>
              )}

              {result.valueChangedCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>[!] {result.valueChangedCount} Value Diff</span>
                </div>
              )}

              {result.typeChangedCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                  <span>[~] {result.typeChangedCount} Type Diff</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. QA Sheet Note Box (Primary Deliverable for Google Sheets) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              QA Defect Summary (Google Sheets Ready)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Format selector tabs */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab("plain")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "plain"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Plain Text</span>
              </button>

              <button
                onClick={() => setActiveTab("tsv")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "tsv"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tab-separated values for direct cell paste"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Sheets TSV</span>
              </button>

              <button
                onClick={() => setActiveTab("markdown")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "markdown"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Code2 className="w-3 h-3 text-blue-600" />
                <span>Markdown</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Note</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              title="Download file"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional endpoint name bar */}
        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Endpoint / Test Case:</span>
          <input
            type="text"
            value={endpointName}
            onChange={(e) => onEndpointNameChange(e.target.value)}
            placeholder="e.g. Tax Return Assessment API"
            className="flex-1 max-w-sm px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Note Output Preview */}
        <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[280px] leading-relaxed rounded-b-xl select-all">
          <pre className="whitespace-pre">{formattedContent}</pre>
        </div>
      </div>
    </div>
  );
};
