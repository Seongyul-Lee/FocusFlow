#!/usr/bin/env node
/**
 * Claude Code PreToolUse Hook: Enforce /docs workflow
 *
 * This hook blocks Edit|Write operations unless:
 * 1. Context7 baseline has been consulted today, OR
 * 2. The file being edited is in an exempt path (docs, config, etc.)
 *
 * Usage: Configured in .claude/settings.json as PreToolUse hook
 */

const fs = require('fs');
const path = require('path');

// Read hook input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(input);
    const result = checkDocsWorkflow(hookData);
    console.log(JSON.stringify(result));
  } catch (error) {
    // On error, allow the operation (fail-open)
    console.log(JSON.stringify({ decision: "allow" }));
  }
});

function checkDocsWorkflow(hookData) {
  const { tool_name, tool_input } = hookData;

  // Only check Edit and Write tools
  if (tool_name !== 'Edit' && tool_name !== 'Write') {
    return { decision: "allow" };
  }

  const filePath = tool_input?.file_path || '';

  // Exempt paths (no /docs required)
  const exemptPatterns = [
    /[/\\]docs[/\\]/,           // docs folder
    /[/\\]\.claude[/\\]/,       // .claude folder
    /[/\\]\.taskmaster[/\\]/,   // taskmaster folder
    /\.md$/i,                   // markdown files
    /\.json$/i,                 // json files (config, package.json, etc.)
    /\.txt$/i,                  // text files
    /[/\\]messages[/\\]/,       // i18n messages
    /[/\\]public[/\\]/,         // public assets
  ];

  const isExempt = exemptPatterns.some(pattern => pattern.test(filePath));
  if (isExempt) {
    return { decision: "allow" };
  }

  // Check context7-baseline.json for today's entry
  const baselinePath = path.join(process.cwd(), 'docs', 'context7-baseline.json');

  if (!fs.existsSync(baselinePath)) {
    return {
      decision: "block",
      reason: "[/docs 강제] context7-baseline.json이 없습니다. 먼저 /docs를 실행하여 Context7 문서를 조회하세요."
    };
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Baseline is an array directly (not { entries: [...] })
    const entries = Array.isArray(baseline) ? baseline : (baseline.entries || []);

    // Check if any entry was retrieved today
    const hasToday = entries.some(entry => {
      const entryDate = entry.retrievedAt?.split('T')[0];
      return entryDate === today;
    });

    if (hasToday) {
      return { decision: "allow" };
    }

    return {
      decision: "block",
      reason: `[/docs 강제] 오늘(${today}) Context7 문서를 조회한 기록이 없습니다.\n\n코드 수정 전에 /docs를 실행하여 관련 라이브러리 문서를 조회하세요.\n(예: /docs nextjs, /docs radix-ui)\n\n대상 파일: ${filePath}`
    };

  } catch (error) {
    // If baseline parsing fails, allow (fail-open)
    return { decision: "allow" };
  }
}
