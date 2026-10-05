import { DiffResult, DiffItem, formatValuePreview } from "./diffEngine";

/**
 * Generates the standard Plain Text QA Defect Tracker note
 * Matches the exact requested specification
 */
export function generateQANote(result: DiffResult, endpointName?: string): string {
  if (result.isMatch) {
    return [
      `========================================`,
      `ETDS API RESPONSE COMPARISON REPORT`,
      `========================================`,
      endpointName ? `Endpoint/Test Case: ${endpointName}` : ``,
      `Status: MATCHED / OK`,
      `Summary: Both Dev and Stage payloads are functionally identical (0 differences found).`,
      `Checked At: ${new Date(result.timestamp).toLocaleString()}`,
      `========================================`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const lines: string[] = [];
  lines.push(`========================================`);
  lines.push(`ETDS API RESPONSE COMPARISON REPORT`);
  lines.push(`========================================`);
  if (endpointName) {
    lines.push(`Endpoint / Scenario: ${endpointName}`);
  }
  lines.push(
    `Status: Mismatch (${result.totalDifferences} difference${result.totalDifferences === 1 ? "" : "s"} found)`
  );
  lines.push(
    `Breakdown: [-] ${result.removedCount} Missing | [+] ${result.addedCount} Extra | [!] ${result.valueChangedCount} Value Mismatch | [~] ${result.typeChangedCount} Type Mismatch`
  );
  lines.push(`----------------------------------------`);

  for (const item of result.differences) {
    switch (item.type) {
      case "removed":
        lines.push(`[-] Missing in Stage: ${item.path} | Dev: ${formatValuePreview(item.devValue)}`);
        break;
      case "added":
        lines.push(`[+] Extra in Stage: ${item.path} | Stage: ${formatValuePreview(item.stageValue)}`);
        break;
      case "value_changed":
        lines.push(
          `[!] Value Mismatch: ${item.path} | Dev: ${formatValuePreview(item.devValue)} vs Stage: ${formatValuePreview(item.stageValue)}`
        );
        break;
      case "type_changed":
        lines.push(
          `[~] Type Mismatch: ${item.path} | Dev: ${item.devType} (${formatValuePreview(item.devValue)}) vs Stage: ${item.stageType} (${formatValuePreview(item.stageValue)})`
        );
        break;
    }
  }

  lines.push(`----------------------------------------`);
  lines.push(`Generated: ${new Date(result.timestamp).toLocaleString()}`);
  lines.push(`Tool: ETDS API Response Diff Checker`);

  return lines.join("\n");
}

/**
 * Generates TSV (Tab Separated Values) format
 * Perfect for direct copy-paste into Google Sheets / Excel columns
 */
export function generateTSVReport(result: DiffResult): string {
  if (result.isMatch) {
    return "Status\tMessage\nMATCHED\tPayloads are functionally identical.";
  }

  const headers = ["Index", "Type", "JSON Path", "Dev Value", "Stage Value", "Details"];
  const rows = result.differences.map((item, idx) => {
    const typeLabel =
      item.type === "removed"
        ? "[-] Missing in Stage"
        : item.type === "added"
        ? "[+] Extra in Stage"
        : item.type === "value_changed"
        ? "[!] Value Mismatch"
        : "[~] Type Mismatch";

    const devStr = item.devValue !== undefined ? formatValuePreview(item.devValue) : "N/A";
    const stageStr = item.stageValue !== undefined ? formatValuePreview(item.stageValue) : "N/A";
    const details = item.message.replace(/\t|\n/g, " ");

    return [idx + 1, typeLabel, item.path, devStr, stageStr, details].join("\t");
  });

  return [headers.join("\t"), ...rows].join("\n");
}

/**
 * Generates Markdown format suitable for Jira/GitHub/GitLab issues
 */
export function generateMarkdownReport(result: DiffResult, endpointName?: string): string {
  if (result.isMatch) {
    return `### 🟢 ETDS API Comparison: MATCHED / OK\n\n${
      endpointName ? `**Endpoint:** \`${endpointName}\`\n\n` : ""
    }Both Dev and Stage responses are functionally identical (0 differences).`;
  }

  const header = `### 🔴 ETDS API Comparison: Mismatch Detected\n\n${
    endpointName ? `**Endpoint:** \`${endpointName}\`\n\n` : ""
  }- **Total Differences:** ${result.totalDifferences}\n- **Missing in Stage:** ${result.removedCount}\n- **Extra in Stage:** ${result.addedCount}\n- **Value Mismatches:** ${result.valueChangedCount}\n- **Type Mismatches:** ${result.typeChangedCount}\n\n`;

  const tableHeader = `| # | Type | JSON Path | Dev Value | Stage Value |\n|---|---|---|---|---|\n`;
  const tableRows = result.differences
    .map((item, idx) => {
      const typeBadge =
        item.type === "removed"
          ? "`[-] Missing`"
          : item.type === "added"
          ? "`[+] Extra`"
          : item.type === "value_changed"
          ? "`[!] Value Diff`"
          : "`[~] Type Diff`";

      const cleanVal = (v: any) =>
        String(formatValuePreview(v)).replace(/\|/g, "\\|").substring(0, 80);

      const devVal = item.devValue !== undefined ? cleanVal(item.devValue) : "*(empty)*";
      const stageVal = item.stageValue !== undefined ? cleanVal(item.stageValue) : "*(empty)*";

      return `| ${idx + 1} | ${typeBadge} | \`${item.path}\` | \`${devVal}\` | \`${stageVal}\` |`;
    })
    .join("\n");

  return header + tableHeader + tableRows;
}
