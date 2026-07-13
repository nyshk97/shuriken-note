import { StateEffect, StateField, type EditorState } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";

/**
 * Tracks reserved insertion points for in-flight file uploads.
 *
 * A widget decoration is placed at the cursor position when an upload
 * starts. CodeMirror maps decoration positions through every subsequent
 * change (typing, undo, other uploads resolving), so when the upload
 * finishes we can insert the markdown exactly where the user asked for
 * it, no matter what happened in between.
 */

class UploadWidget extends WidgetType {
  constructor(readonly id: number) {
    super();
  }

  override eq(other: UploadWidget): boolean {
    return other.id === this.id;
  }

  override toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-upload-placeholder";
    span.textContent = "Uploading…";
    return span;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

export const addUploadEffect = StateEffect.define<{ id: number; pos: number }>({
  map: (value, changes) => ({ ...value, pos: changes.mapPos(value.pos, 1) }),
});

export const removeUploadEffect = StateEffect.define<{ id: number }>();

export const uploadPlaceholderField = StateField.define<DecorationSet>({
  create: () => Decoration.none,

  update(decorations, tr) {
    let next = decorations.map(tr.changes);

    for (const effect of tr.effects) {
      if (effect.is(addUploadEffect)) {
        const widget = Decoration.widget({
          widget: new UploadWidget(effect.value.id),
          side: 1,
        });
        next = next.update({ add: [widget.range(effect.value.pos)] });
      } else if (effect.is(removeUploadEffect)) {
        next = next.update({
          filter: (_from, _to, deco) =>
            (deco.spec.widget as UploadWidget).id !== effect.value.id,
        });
      }
    }

    return next;
  },

  provide: (field) => EditorView.decorations.from(field),
});

/**
 * Find the current (change-mapped) position reserved for an upload.
 * Returns null if the placeholder was removed.
 */
export function findUploadPos(state: EditorState, id: number): number | null {
  let pos: number | null = null;
  const decorations = state.field(uploadPlaceholderField, false);
  if (!decorations) return null;

  decorations.between(0, state.doc.length, (from, _to, deco) => {
    if ((deco.spec.widget as UploadWidget).id === id) {
      pos = from;
      return false;
    }
  });

  return pos;
}

let nextUploadId = 0;

export function createUploadId(): number {
  return nextUploadId++;
}
