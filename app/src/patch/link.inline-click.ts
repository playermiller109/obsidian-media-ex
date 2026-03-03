import type { EditorView } from "@codemirror/view";

export function passThroughClick(e: MouseEvent, cm: EditorView) {
  if (cm) {
    const pos = cm.posAtCoords({ x: e.clientX, y: e.clientY });

    if (pos !== null) {
      cm.focus();
      cm.dispatch({
        selection: { anchor: pos, head: pos },
      });
    }
  }
}
