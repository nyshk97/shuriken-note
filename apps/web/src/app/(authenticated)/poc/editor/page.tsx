"use client";

import { useState } from "react";
import { VditorEditor } from "@/components/editor";

const INITIAL_MARKDOWN = `# Vditor PoC - IR Mode Test

This is a **proof of concept** for Vditor's Instant Rendering mode.

## Features to Test

- [ ] Japanese IME input (日本語入力テスト)
- [ ] Bold and *italic* formatting
- [ ] Code blocks
- [ ] Lists and checkboxes

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Japanese Text

日本語の入力をテストしてください。漢字変換、ひらがな、カタカナが正しく動作するか確認します。

---

Try typing below and see how IR mode works!
`;

export default function EditorPocPage() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Vditor Editor PoC</h1>
        <p className="text-muted-foreground">
          Testing Vditor&apos;s IR (Instant Rendering) mode - Typora-like
          editing experience
        </p>
      </div>

      <div className="grid gap-6">
        {/* Editor */}
        <div className="border rounded-lg overflow-hidden">
          <VditorEditor
            value={markdown}
            onChange={setMarkdown}
            height={500}
            placeholder="Start writing in Markdown..."
          />
        </div>

        {/* Raw Markdown Output */}
        <details className="border rounded-lg">
          <summary className="px-4 py-3 cursor-pointer bg-muted/50 font-medium">
            Raw Markdown Output
          </summary>
          <pre className="p-4 text-sm overflow-auto max-h-[300px] bg-muted/20">
            <code>{markdown}</code>
          </pre>
        </details>
      </div>
    </div>
  );
}
