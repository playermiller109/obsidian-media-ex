import { MarkdownRenderChild } from "obsidian";
import ReactDOM from "react-dom/client";
import { MediaViewContext, createMediaViewStore } from "@/components/context";
import { Player } from "@/components/player";
import type { MediaURL } from "@/info/media-url";
import type MxPlugin from "@/mx-main";
import { type PlayerComponent } from "./base";

export class MediaRenderChild
  extends MarkdownRenderChild
  implements PlayerComponent
{
  store;
  root: ReactDOM.Root | null = null;
  get player() {
    return this.store.getState().player;
  }
  constructor(public containerEl: HTMLElement, public plugin: MxPlugin) {
    super(containerEl);
    this.store = createMediaViewStore(plugin);
    containerEl.addClasses(["mx", "custom", "mx-media-embed"]);
  }

  getMediaInfo() {
    return this.store.getState().source?.url ?? null;
  }

  async setSource(
    media: MediaURL,
    other: Partial<{ title: string; hash: string }> = {},
  ) {
    const viewType = this.plugin.urlViewType.getPreferred(media);
    this.store.getState().setSource(media, {
      title: other.title ?? true,
      hash: other.hash,
      viewType,
      textTracks: await this.plugin.transcript.getTracks(media).catch((e) => {
        console.error("Failed to get text tracks", e, media.href);
        return [];
      }),
    });
  }

  render() {
    this.root?.unmount();
    this.root = ReactDOM.createRoot(this.containerEl);
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

  onunload() {
    // unmount before detach from DOM
    this.root?.unmount();
    this.root = null;
    super.onunload();
  }
}
