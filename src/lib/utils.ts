import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function stripMarkdownCodeFences(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * If an LLM returns “smart quotes” as JSON delimiters (invalid JSON),
 * normalize ONLY those delimiter-like quotes to ASCII `"` without touching
 * curly quotes inside already-quoted content.
 *
 * This is intentionally conservative: it targets curly quotes that appear
 * adjacent to JSON structural characters (`, : { } [ ]`) rather than replacing
 * all curly quotes globally (which can corrupt valid JSON strings).
 */
function normalizeCurlyQuotesAsJsonDelimiters(text: string): string {
  let out = text;

  // Opening quotes after structural chars / whitespace
  out = out.replace(/(^|[\s{\[,:])[\u201C\u201D](?=\S)/g, '$1"');

  // Closing quotes before `:`, `,`, `}`, `]` (or end)
  out = out.replace(/[\u201C\u201D](?=\s*[:\],}])/g, '"');

  return out;
}

/**
 * Sanitizes a JSON string by replacing problematic characters with valid JSON characters
 * @param jsonString - The JSON string to sanitize
 * @returns The sanitized JSON string
 */
export function sanitizeJsonString(jsonString: string): string {
  let cleaned = stripMarkdownCodeFences(jsonString);
  
  // Remove BOM (Byte Order Mark)
  cleaned = cleaned.replace(/^\uFEFF/, '');

  // Replace other problematic characters
  // En dash and em dash → regular hyphen
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-');
  // Horizontal ellipsis → three dots
  cleaned = cleaned.replace(/[\u2026]/g, '...');
  // Non-breaking space → regular space
  cleaned = cleaned.replace(/\u00A0/g, ' ');
  // Zero-width space and other zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return cleaned;
}

/**
 * Safely parses a JSON string with automatic sanitization and error handling
 * @param jsonString - The JSON string to parse
 * @param context - Optional context for better error messages
 * @returns The parsed JSON object
 * @throws Error with detailed message if parsing fails
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  context?: string
): T {
  const cleaned = sanitizeJsonString(jsonString);
  try {
    return JSON.parse(cleaned) as T;
  } catch (error1) {
    // Second pass: only normalize curly quotes if they appear to be used as delimiters
    const normalized = normalizeCurlyQuotesAsJsonDelimiters(cleaned);
    try {
      return JSON.parse(normalized) as T;
    } catch (error2) {
      const errorMessage =
        error2 instanceof Error ? error2.message : "Unknown parsing error";
    const contextStr = context ? ` (${context})` : "";
    
    // Get position info if available
    const positionMatch = errorMessage.match(/position (\d+)/);
    const position = positionMatch ? parseInt(positionMatch[1], 10) : null;
    
    // Create a helpful error message with context
    let detailedMessage = `Failed to parse JSON${contextStr}: ${errorMessage}`;
    
    if (position !== null) {
      const start = Math.max(0, position - 50);
      const end = Math.min(normalized.length, position + 50);
      const snippet = normalized.substring(start, end);
      const marker = ' '.repeat(Math.min(50, position - start)) + '^';
      
      detailedMessage += `\n\nNear position ${position}:\n${snippet}\n${marker}`;
    } else {
      // Show first 200 characters if no position info
      const preview = normalized.substring(0, 200);
      detailedMessage += `\n\nFirst 200 characters:\n${preview}${normalized.length > 200 ? '...' : ''}`;
    }
    
    throw new Error(detailedMessage);
    }
  }
}

/**
 * Attempts to parse JSON with multiple strategies and returns a result object
 * @param jsonString - The JSON string to parse
 * @returns Object with success status, data if successful, or error details if failed
 */
export function tryParseJson<T = unknown>(
  jsonString: string
): { success: true; data: T; raw: string } | { success: false; error: string; raw: string; parseError?: string } {
  const raw = jsonString;
  
  try {
    const data = safeJsonParse<T>(jsonString);
    return { success: true, data, raw };
  } catch (error) {
    return {
      success: false,
      error: "Failed to parse agent response",
      raw,
      parseError: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
