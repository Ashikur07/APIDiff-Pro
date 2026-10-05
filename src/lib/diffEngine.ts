export type DiffType = 'added' | 'removed' | 'value_changed' | 'type_changed';

export interface DiffItem {
  id: string;
  type: DiffType;
  path: string;
  devValue?: any;
  stageValue?: any;
  devType?: string;
  stageType?: string;
  message: string;
}

export interface DiffOptions {
  ignoreArrayOrder?: boolean;
  ignoreWhitespaceInStrings?: boolean;
  caseInsensitiveKeys?: boolean;
}

export interface DiffResult {
  isMatch: boolean;
  totalDifferences: number;
  addedCount: number;
  removedCount: number;
  valueChangedCount: number;
  typeChangedCount: number;
  differences: DiffItem[];
  normalizedDev: any;
  normalizedStage: any;
  timestamp: string;
}

export interface JSONValidationResult {
  isValid: boolean;
  parsed: any;
  error?: string;
  line?: number;
  column?: number;
}

/**
 * Validates JSON string and extracts syntax error details with line/col if possible
 */
export function validateJSON(input: string): JSONValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      parsed: null,
      error: "Input payload is empty",
    };
  }

  try {
    const parsed = JSON.parse(input);
    return {
      isValid: true,
      parsed,
    };
  } catch (err: any) {
    const message = err?.message || "Invalid JSON syntax";
    let line: number | undefined;
    let column: number | undefined;

    // Try to extract line and column from error message
    // e.g., "Unexpected token '}' at line 5 column 10" or "at position 123"
    const lineColMatch = message.match(/line (\d+) column (\d+)/i);
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else {
      const posMatch = message.match(/position (\d+)/i);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        const textUpToError = input.substring(0, pos);
        const lines = textUpToError.split("\n");
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
    }

    return {
      isValid: false,
      parsed: null,
      error: message,
      line,
      column,
    };
  }
}

/**
 * Gets human-readable type of a JavaScript value
 */
export function getDetailedType(val: any): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

/**
 * Normalizes an object or array for deterministic comparison
 */
export function normalizeStructure(data: any, ignoreArrayOrder: boolean): any {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    const normalizedItems = data.map((item) =>
      normalizeStructure(item, ignoreArrayOrder)
    );

    if (!ignoreArrayOrder) {
      return normalizedItems;
    }

    // Sort array deterministically
    return normalizedItems.slice().sort((a, b) => {
      // 1. If both are primitives
      if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
        return String(a).localeCompare(String(b));
      }

      // 2. Try common unique identifier keys (frequent in ETDS/REST APIs)
      const commonKeys = [
        "id",
        "user_id",
        "tin",
        "code",
        "key",
        "name",
        "uuid",
        "slug",
        "type",
        "ref",
        "account_no",
        "challan_no",
        "taxpayer_id",
        "assessment_year",
      ];

      for (const k of commonKeys) {
        if (a[k] !== undefined && b[k] !== undefined) {
          return String(a[k]).localeCompare(String(b[k]));
        }
      }

      // 3. Fallback to deterministic JSON string representation
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });
  }

  // Plain object: sort keys
  const sortedObj: Record<string, any> = {};
  const keys = Object.keys(data).sort();
  for (const key of keys) {
    sortedObj[key] = normalizeStructure(data[key], ignoreArrayOrder);
  }
  return sortedObj;
}

/**
 * Formats a value for preview in QA notes and diff items
 */
export function formatValuePreview(val: any): string {
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    return `Array(${val.length})`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    return `{ ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""} }`;
  }
  return String(val);
}

/**
 * Deep recursive diff comparison between Dev and Stage objects
 */
export function deepDiff(
  dev: any,
  stage: any,
  options: DiffOptions = { ignoreArrayOrder: true }
): DiffResult {
  const differences: DiffItem[] = [];
  const normalizedDev = normalizeStructure(dev, !!options.ignoreArrayOrder);
  const normalizedStage = normalizeStructure(stage, !!options.ignoreArrayOrder);

  let idCounter = 1;

  function addDiff(
    type: DiffType,
    path: string,
    devVal: any,
    stageVal: any,
    customMsg?: string
  ) {
    const devType = getDetailedType(devVal);
    const stageType = getDetailedType(stageVal);
    const displayPath = path || "(root)";

    let message = customMsg || "";
    if (!message) {
      switch (type) {
        case "added":
          message = `Extra in Stage: ${displayPath} -> ${formatValuePreview(stageVal)}`;
          break;
        case "removed":
          message = `Missing in Stage: ${displayPath} -> ${formatValuePreview(devVal)}`;
          break;
        case "value_changed":
          message = `Value Mismatch at ${displayPath}: Dev is ${formatValuePreview(devVal)} vs Stage is ${formatValuePreview(stageVal)}`;
          break;
        case "type_changed":
          message = `Type Mismatch at ${displayPath}: Dev is ${devType} (${formatValuePreview(devVal)}) vs Stage is ${stageType} (${formatValuePreview(stageVal)})`;
          break;
      }
    }

    differences.push({
      id: `diff-${idCounter++}`,
      type,
      path: displayPath,
      devValue: devVal,
      stageValue: stageVal,
      devType,
      stageType,
      message,
    });
  }

  function compare(d: any, s: any, currentPath: string) {
    const dType = getDetailedType(d);
    const sType = getDetailedType(s);

    // 1. Both identical references or values
    if (d === s) {
      return;
    }

    // 2. Type Mismatch
    if (dType !== sType) {
      addDiff("type_changed", currentPath, d, s);
      return;
    }

    // 3. Null / Undefined
    if (d === null || s === null || d === undefined || s === undefined) {
      if (d !== s) {
        addDiff("value_changed", currentPath, d, s);
      }
      return;
    }

    // 4. Arrays
    if (Array.isArray(d) && Array.isArray(s)) {
      const maxLen = Math.max(d.length, s.length);

      for (let i = 0; i < maxLen; i++) {
        const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`;

        if (i >= d.length) {
          // Extra in Stage
          addDiff("added", itemPath, undefined, s[i]);
        } else if (i >= s.length) {
          // Missing in Stage
          addDiff("removed", itemPath, d[i], undefined);
        } else {
          compare(d[i], s[i], itemPath);
        }
      }
      return;
    }

    // 5. Objects
    if (typeof d === "object" && typeof s === "object") {
      const devKeys = Object.keys(d);
      const stageKeys = Object.keys(s);
      const allKeys = Array.from(new Set([...devKeys, ...stageKeys])).sort();

      for (const key of allKeys) {
        const keyPath = currentPath ? `${currentPath}.${key}` : key;
        const hasInDev = Object.prototype.hasOwnProperty.call(d, key);
        const hasInStage = Object.prototype.hasOwnProperty.call(s, key);

        if (hasInDev && !hasInStage) {
          addDiff("removed", keyPath, d[key], undefined);
        } else if (!hasInDev && hasInStage) {
          addDiff("added", keyPath, undefined, s[key]);
        } else {
          compare(d[key], s[key], keyPath);
        }
      }
      return;
    }

    // 6. Primitive Values (string, number, boolean)
    if (d !== s) {
      addDiff("value_changed", currentPath, d, s);
    }
  }

  compare(normalizedDev, normalizedStage, "");

  const addedCount = differences.filter((d) => d.type === "added").length;
  const removedCount = differences.filter((d) => d.type === "removed").length;
  const valueChangedCount = differences.filter((d) => d.type === "value_changed").length;
  const typeChangedCount = differences.filter((d) => d.type === "type_changed").length;

  return {
    isMatch: differences.length === 0,
    totalDifferences: differences.length,
    addedCount,
    removedCount,
    valueChangedCount,
    typeChangedCount,
    differences,
    normalizedDev,
    normalizedStage,
    timestamp: new Date().toISOString(),
  };
}
