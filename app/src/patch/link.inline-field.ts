import { EditorView } from "@codemirror/view";
import { mediaSourceFields } from "@/media-note/note-index/def";
import type MxPlugin from "@/mx-main";
import { isModEvent } from "./mod-evt";

export default function patchInlineUrl(this: MxPlugin) {
  const clickHandler = (e: MouseEvent, cm: EditorView) => {
    const target = e.target as HTMLElement;
    if (!target.instanceOf(HTMLElement)) return;

    const linktext = target.textContent;
    [
      {
        selector: ".metadata-property .metadata-property-value .external-link",
        fn: () => {
          const main = target.closest<HTMLElement>(".metadata-property");
          if (!main) return;
          const key = main.dataset.propertyKey;
          if (!mediaSourceFields.includes(key as any)) return;
          const urlInfo = this.resolveUrl(linktext);
          if (!urlInfo) return;
          e.stopImmediatePropagation();
          this.leafOpener.openMedia(urlInfo, isModEvent(e), { fromUser: true });
          return true;
        }
      },
    ]
    .some(s => target.matches(s.selector) && s.fn());
  }

  this.registerEditorExtension([
    EditorView.domEventHandlers({
      click: clickHandler
    })
  ])
}
