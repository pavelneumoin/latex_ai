// Универсальная абстракция «экспорт рабочего листа в формат X».
// Утром: добавить новые экспортёры (например, EPUB, Anki, Quizlet) — просто новый файл lib/exporters/<format>.ts.

export type ExportFormat = "pdf" | "docx" | "latex" | "latex-zip" | "html";

export interface WorksheetContent {
  title: string;
  subtitle?: string;
  subject?: string;
  grade?: number;
  topic?: string;
  templateId: string;
  tasks: Array<{
    n: number;
    condition: string;
    expected_answer?: string;
    answer_type?:
      | "number"
      | "fraction"
      | "expression"
      | "string"
      | "list"
      | "choice"
      | "multiple_choice"
      | "true_false"
      | "fill_blank"
      | "matching"
      | "short_text"
      | "open";
    /** Варианты ответа для choice / multiple_choice / true_false / matching. */
    options?: string[];
    tolerance?: number;
    solution?: string;
    hint?: string;
    image?: string; // optional path/url
  }>;
}

export interface ExportInput {
  worksheetId: string;
  content: WorksheetContent;
  templateId: string;
  brand?: {
    teacherName?: string;
    school?: string;
    logoPath?: string;
    watermark?: string;
    accentColor?: string;
  };
  /** Добавить страницу «Ключ ответов» с решениями (версия для учителя). */
  includeAnswers?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  mimeType: string;
  // Либо буфер в памяти, либо абсолютный путь к файлу — обработчик ответа сам разберётся.
  data?: Buffer;
  path?: string;
}

export interface Exporter {
  readonly format: ExportFormat;
  readonly name: string;
  isReady(): Promise<boolean> | boolean;
  export(input: ExportInput): Promise<ExportResult>;
}
