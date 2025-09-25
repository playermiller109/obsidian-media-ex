import { handlePaneMigration } from "@/lib/window-migration";
import type { MediaRemoteViewState } from "./remote-view";
import { MediaRemoteView } from "./remote-view";
import type { MediaEmbedViewType } from "./view-type";
import { MEDIA_EMBED_VIEW_TYPE } from "./view-type";

export type MediaEmbedViewState = MediaRemoteViewState;

export const hostTitleMap: Record<string, string> = {
  "video/vimeo": "Vimeo",
  "video/youtube": "YouTube",
};

export class MediaEmbedView extends MediaRemoteView {
  onload(): void {
    super.onload();
    this.registerRemoteTitleChange();
    handlePaneMigration(this, () => this.render());
  }

  getDisplayText(): string {
    const source = hostTitleMap[this.sourceType] ?? "Embed";
    if (!this.playerTitle) return source;
    return `${this.playerTitle} - ${source}`;
  }
  getIcon(): string {
    switch (this.sourceType) {
      case "video/youtube":
        return "youtube";
      case "video/vimeo":
        return "vimeo";
      default:
        return "video";
    }
  }
  getViewType(): MediaEmbedViewType {
    return MEDIA_EMBED_VIEW_TYPE;
  }
}
