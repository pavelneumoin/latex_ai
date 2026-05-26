// Загрузчик промптов из cli/prompts/.
// Промпт-файлы имеют секции `# SYSTEM`, `# USER_TEMPLATE`, `# OUTPUT_SCHEMA`.
// Здесь — только разбор и шаблонизация {{переменные}}.

import path from "node:path";
import { promises as fs } from "node:fs";

const PROMPTS_DIR = path.join(process.cwd(), "..", "cli", "prompts");

export type PromptId =
  | "generate_from_topic"
  | "generate_from_material"
  | "generate_more_variants"
  | "generate_harder"
  | "check_worksheet";

interface ParsedPrompt {
  system: string;
  userTemplate: string;
  outputSchema?: Record<string, unknown>;
}

const cache = new Map<PromptId, ParsedPrompt>();

export async function loadPrompt(id: PromptId): Promise<ParsedPrompt> {
  if (cache.has(id)) return cache.get(id)!;

  const file = path.join(PROMPTS_DIR, `${id}.md`);
  const raw = await fs.readFile(file, "utf-8");
  const parsed = parsePromptFile(raw);
  cache.set(id, parsed);
  return parsed;
}

function parsePromptFile(raw: string): ParsedPrompt {
  // Делим по заголовкам "# SYSTEM" / "# USER_TEMPLATE" / "# OUTPUT_SCHEMA".
  const sections: Record<string, string> = {};
  const re = /^#\s+(SYSTEM|USER_TEMPLATE|OUTPUT_SCHEMA|EXAMPLE_INPUT|EXAMPLE_OUTPUT)\s*$/gm;
  const indices: { name: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    indices.push({ name: m[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < indices.length; i++) {
    const end = i + 1 < indices.length ? indices[i + 1].start - 0 : raw.length;
    const slice = raw.slice(indices[i].start, end).trim();
    // отрезаем продолжение до следующего "# " (на всякий случай)
    const nextHeader = slice.search(/^#\s+\w+\s*$/m);
    sections[indices[i].name] =
      nextHeader > -1 ? slice.slice(0, nextHeader).trim() : slice;
  }

  let outputSchema: Record<string, unknown> | undefined;
  const schemaRaw = sections["OUTPUT_SCHEMA"];
  if (schemaRaw) {
    // Достаём первый json-блок.
    const codeBlock = schemaRaw.match(/```json\s*([\s\S]*?)```/);
    const body = codeBlock ? codeBlock[1] : schemaRaw;
    try {
      outputSchema = JSON.parse(body);
    } catch {
      outputSchema = undefined;
    }
  }

  return {
    system: sections["SYSTEM"] || "",
    userTemplate: sections["USER_TEMPLATE"] || "",
    outputSchema,
  };
}

export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  });
}
