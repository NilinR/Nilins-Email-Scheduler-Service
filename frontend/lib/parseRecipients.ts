import Papa from 'papaparse';

export interface ParsedRecipients {
  valid: string[];
  invalid: string[];
  duplicateCount: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipientsFile(text: string): ParsedRecipients {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const rawEntries = parsed.data.flat().map((s) => s.trim()).filter(Boolean);

  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicateCount = 0;

  for (const entry of rawEntries) {
    if (!EMAIL_REGEX.test(entry)) {
      invalid.push(entry);
      continue;
    }
    if (seen.has(entry.toLowerCase())) {
      duplicateCount++;
      continue;
    }
    seen.add(entry.toLowerCase());
    valid.push(entry);
  }

  return { valid, invalid, duplicateCount };
}
