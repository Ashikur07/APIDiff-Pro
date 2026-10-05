"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Copy,
  Check,
  ListTree,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  RefreshCw,
  Code2,
  Layers,
} from "lucide-react";
import { DiffResult, DiffItem, formatValuePreview } from "@/lib/diffEngine";

interface VisualTreeProps {
  result: DiffResult;
}

export const VisualTree: React.FC<VisualTreeProps> = ({ result }) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "side-by-side">("list");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Filtered diff items
  const filteredDiffs = React.useMemo(() => {
    return result.differences.filter((item) => {
      if (activeFilter !== "all" && item.type !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pathMatches = item.path.toLowerCase().includes(q);
        const msgMatches = item.message.toLowerCase().includes(q);
        const devValMatches =
          item.devValue !== undefined &&
          JSON.stringify(item.devValue).toLowerCase().includes(q);
        const stageValMatches =
          item.stageValue !== undefined &&
          JSON.stringify(item.stageValue).toLowerCase().includes(q);

        return pathMatches || msgMatches || devValMatches || stageValMatches;
      }
      return true;
    });
  }, [result.differences, activeFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1500);
    } catch {}
  };

  const getDiffBadge = (type: DiffItem["type"]) => {
    switch (type) {
      case "removed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Missing in Stage</span>
          </span>
        );
      case "added":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Extra in Stage</span>
          </span>
        );
      case "value_changed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Value Mismatch</span>
          </span>
        );
      case "type_changed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
            <span>Type Mismatch</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            Detailed Field Differences
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
              {filteredDiffs.length}
            </span>
          </h3>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Differences</span>
            </button>
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "side-by-side"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Normalized View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeFilter === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({result.totalDifferences})
          </button>
          {result.removedCount > 0 && (
            <button
              onClick={() => setActiveFilter("removed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === "removed"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              [-] Missing ({result.removedCount})
            </button>
          )}
          {result.addedCount > 0 && (
            <button
              onClick={() => setActiveFilter("added")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === "added"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              [+] Extra ({result.addedCount})
            </button>
          )}
          {result.valueChangedCount > 0 && (
            <button
              onClick={() => setActiveFilter("value_changed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === "value_changed"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              [!] Value Diff ({result.valueChangedCount})
            </button>
          )}
          {result.typeChangedCount > 0 && (
            <button
              onClick={() => setActiveFilter("type_changed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === "type_changed"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              [~] Type Diff ({result.typeChangedCount})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by key or value..."
            className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Diff Content */}
      {viewMode === "list" ? (
        <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
          {filteredDiffs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching differences found.
            </div>
          ) : (
            filteredDiffs.map((item, index) => {
              const isExpanded = !!expandedItems[item.id];
              const isComplexDev =
                typeof item.devValue === "object" && item.devValue !== null;
              const isComplexStage =
                typeof item.stageValue === "object" && item.stageValue !== null;
              const hasComplexValues = isComplexDev || isComplexStage;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3 bg-white hover:border-slate-300 transition-colors shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Path & Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-slate-400 select-none">
                        #{index + 1}
                      </span>
                      {getDiffBadge(item.type)}
                      <div className="flex items-center gap-1.5">
                        <code className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs rounded border border-slate-200">
                          {item.path}
                        </code>
                        <button
                          onClick={() => handleCopyPath(item.path)}
                          title="Copy JSON path"
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        >
                          {copiedPath === item.path ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {hasComplexValues && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <span>{isExpanded ? "Collapse" : "Expand JSON"}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Dev vs Stage Comparison */}
                  <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
                    {/* Dev Value */}
                    <div className="bg-blue-50/50 p-2.5 rounded-md border border-blue-100">
                      <div className="text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center justify-between">
                        <span>Dev Value</span>
                        {item.devType && (
                          <span className="text-[10px] text-blue-500 font-normal">
                            Type: {item.devType}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 break-all">
                        {item.devValue === undefined ? (
                          <span className="italic text-slate-400">
                            (Missing / Not Present)
                          </span>
                        ) : (
                          formatValuePreview(item.devValue)
                        )}
                      </div>
                    </div>

                    {/* Stage Value */}
                    <div className="bg-emerald-50/50 p-2.5 rounded-md border border-emerald-100">
                      <div className="text-[11px] font-semibold text-emerald-700 mb-0.5 flex items-center justify-between">
                        <span>Stage Value</span>
                        {item.stageType && (
                          <span className="text-[10px] text-emerald-500 font-normal">
                            Type: {item.stageType}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 break-all">
                        {item.stageValue === undefined ? (
                          <span className="italic text-slate-400">
                            (Missing / Not Present)
                          </span>
                        ) : (
                          formatValuePreview(item.stageValue)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable JSON Detail */}
                  {isExpanded && hasComplexValues && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <div className="text-[11px] text-slate-500 mb-1">
                          Dev Raw Object:
                        </div>
                        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-md max-h-48 overflow-auto">
                          {JSON.stringify(item.devValue, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 mb-1">
                          Stage Raw Object:
                        </div>
                        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-md max-h-48 overflow-auto">
                          {JSON.stringify(item.stageValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Side by Side normalized JSON */
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs max-h-[500px] overflow-y-auto">
          <div className="bg-slate-900 text-slate-100 p-3 rounded-lg">
            <div className="text-xs font-bold text-blue-400 mb-1.5 font-sans">
              Normalized Dev Payload
            </div>
            <pre className="overflow-x-auto leading-relaxed">
              {JSON.stringify(result.normalizedDev, null, 2)}
            </pre>
          </div>

          <div className="bg-slate-900 text-slate-100 p-3 rounded-lg">
            <div className="text-xs font-bold text-emerald-400 mb-1.5 font-sans">
              Normalized Stage Payload
            </div>
            <pre className="overflow-x-auto leading-relaxed">
              {JSON.stringify(result.normalizedStage, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
