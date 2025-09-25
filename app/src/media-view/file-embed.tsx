import type { EmbedComponent, EmbedInfo, TFile } from "obsidian";
import { Component } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import { dataLpPassthrough } from "@/components/player/buttons";
import { mediaInfoFromFile, type FileMediaInfo } from "@/info/media-info";
import type MxPlugin from "@/mx-main";
import { type PlayerComponent } from "./base";

export class MediaFileEmbed
  extends Component
  implements EmbedComponent, PlayerComponent
{
  store;
  root: ReactDOM.Root | null = null;
  public containerEl: HTMLElement;
  get player() {
    return this.store.getState().player;
  }
  constructor(
    public info: EmbedInfo,
    public file: TFile,
    public subpath: string,
    public plugin: MxPlugin,
  ) {
    super();
    this.containerEl = info.containerEl;
    this.store = createMediaViewStore(plugin);
    const { containerEl } = info;
    containerEl.addClasses(["mx", "mx-media-embed", "custom"]);
    function isEditButton(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false;
      const button = target.closest("button");
      if (!button) return false;
      return button.hasAttribute(dataLpPassthrough);
    }
    this.registerDomEvent(containerEl, "click", (evt) => {
      // only allow edit button to propagate to lp click handler
      if (!isEditButton(evt.target)) evt.stopImmediatePropagation();
    });
    // containerEl.style.display = "contents";
  }

  getMediaInfo(): FileMediaInfo | null {
    return mediaInfoFromFile(this.file, this.subpath);
  }

  // eslint-disable-next-line react/require-render-return
  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.info.containerEl);
    this.root.render(
      <MediaViewContext.Provider
        value={{
          plugin: this.plugin,
          store: this.store,
          reload: () => this.render(),
          embed: true,
        }}
      >
        <Player />
      </MediaViewContext.Provider>,
    );
  }
  onload(): void {
    super.onload();
    this.render();
  }

  async loadFile() {
    await this.store.getState().loadFile(this.file, {
      vault: this.plugin.app.vault,
      subpath: this.subpath,
    });
  }

  onunload() {
    // unmount before detach from DOM
    this.root?.unmount();
    this.root = null;
    super.onunload();
  }
}
