import { around } from "monkey-around";
import { MarkdownView } from "obsidian";
import { mediaSourceFields } from "@/media-note/note-index/def";
import type MxPlugin from "@/mx-main";
import { isModEvent } from "./mod-evt";

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

export default function patchInlineUrl(this: MxPlugin) {
  const clickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.instanceOf(HTMLElement)) return;
    if (
      target.matches(
        ".metadata-property .metadata-property-value .external-link"
      )
    ) {
      const main = target.closest<HTMLElement>(".metadata-property");
      if (!main) return;
      const key = main.dataset.propertyKey;
      if (!mediaSourceFields.includes(key as any)) return;
      const urlInfo = this.resolveUrl(target.textContent);
      if (!urlInfo) return;
      e.stopImmediatePropagation();
      this.leafOpener.openMedia(urlInfo, isModEvent(e), { fromUser: true });
    }
    else if (target.matches(".cm-link > .cm-underline")) {
      const _ic = findLinkIcon(target.parentElement as Element);
      if (!_ic) return;
      e.stopImmediatePropagation();
    }
  };
  const unload = around(MarkdownView.prototype, {
    onload: (next) =>
      function (this: MarkdownView) {
        this.registerDomEvent(this.containerEl, "click", clickHandler, {
          capture: true,
        });
        return next.call(this);
      },
  });
  this.register(() => {
    unload();
    this.app.workspace
      .getLeavesOfType("markdown")
      .forEach((leaf) =>
        leaf.view.containerEl.removeEventListener("click", clickHandler),
      );
  });
}
