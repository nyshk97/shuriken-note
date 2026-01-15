# 0010 Markdown Editor Library Selection

Date: 2026-01-15

## Status

Accepted

## Context

A Markdown editor is required as a core feature of the note-taking app. We need to select a library that meets the following requirements.

### Required

- **Instant Rendering**: A single-column editing experience where Markdown is converted to rich text in real-time, similar to Typora
- **Japanese IME Support**: Stable input for kanji conversion, hiragana, and katakana
- **Next.js Integration**: Compatible with App Router and SSR

### Nice to Have

- Ability to store content as raw Markdown strings
- Syntax highlighting for code blocks
- Checkbox support
- Auto-linking when pasting URLs
- Toolbar customization

### Not Required

- Real-time collaborative editing
- Notion-like block management

## Decision

We adopt **Vditor**.

### Rationale

1. **IR (Instant Rendering) Mode**: The only library that provides an editing experience nearly identical to Typora
2. **Markdown-first**: Maintains Markdown strings internally, enabling direct storage
3. **Feature-rich**: Syntax highlighting, checkboxes, math equations, diagrams, and more
4. **Japanese IME**: Developed in the Chinese-speaking community with CJK input considerations. Verified to work correctly in our PoC

### Implementation Notes

- **SSR Handling**: Client-side only rendering via `next/dynamic`
- **React Wrapper**: Custom wrapper component required since no official React support
- **Auto-linking URLs**: Implemented by hooking paste events to convert to Markdown link format
- **Japanese Fonts**: CSS overrides to prioritize Japanese fonts (avoiding Chinese glyph variants)
- **Dark Theme**: Supported via built-in dark theme + CSS customization (verified in PoC)

## Alternatives Considered

### Tiptap

- **Pros**: Largest ecosystem, extensive documentation, stable ProseMirror foundation
- **Cons**: No native Instant Rendering mode. Would require significant custom implementation
- **Conclusion**: Difficult to meet the instant rendering requirement

### Milkdown

- **Pros**: Markdown-first design, ProseMirror-based, lightweight
- **Cons**: Reported Japanese IME issues (cursor position drift, misplaced conversion candidates). Limited documentation and examples
- **Conclusion**: Concerns about Japanese IME stability

### Novel

- **Pros**: Built by Vercel, excellent Next.js compatibility, ready to use out of the box
- **Cons**: Notion-like block editor without instant rendering mode
- **Conclusion**: Does not meet the instant rendering requirement

### Plate

- **Pros**: Slate.js-based, highly customizable
- **Cons**: Numerous reported Japanese IME issues (text duplication, cursor jumping, etc.)
- **Conclusion**: Japanese IME problems are severe

## Consequences

### Benefits

- Delivers an editing experience that meets nearly all requirements
- Data stored as Markdown ensures high portability
- Instant rendering allows users to see formatting while writing

### Drawbacks / Risks

- **No Official React Support**: Requires maintaining a custom wrapper
- **Documentation Primarily in Chinese**: May complicate troubleshooting
- **Bundle Size**: Feature-rich nature results in larger size (optimization may be needed)

### Future Considerations

- Bundle size verification (not expected to be a major issue, but should be measured in production builds)
- Link card feature implementation (post-MVP)
