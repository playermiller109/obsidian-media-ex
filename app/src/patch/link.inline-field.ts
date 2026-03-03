import { EditorView } from "@codemirror/view";
import { mediaSourceFields } from "@/media-note/note-index/def";
import type MxPlugin from "@/mx-main";
import { isModEvent } from "./mod-evt";
// since 1.12.4
import * as utils from './link.inline-click';

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
      {
        selector: ".cm-link > .cm-underline",
        fn: () => {
          const _ic = findLinkIcon(target.parentElement as Element);
          if (!_ic) return;
          e.stopImmediatePropagation();

          utils.passThroughClick(e, cm);
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
function findLinkIcon(start: Element): Element | null {
  const parent = start.parentElement;
  if (!parent) return null;
  const kids = Array.from(parent.children);
  const idx = kids.indexOf(start);
  if (idx === -1) return null;
  for (let i = idx + 1; i < kids.length; i++) {
    const _ic = kids[i];
    if (_ic.matches("span.cm-url.external-link")) return _ic;
    if (_ic.matches("span.cm-link")) return null;
  }
  return null;
}