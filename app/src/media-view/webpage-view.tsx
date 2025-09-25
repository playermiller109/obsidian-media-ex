import { MediaHost, mediaHostDisplayName } from "@/info/supported";
import { handlePaneMigration } from "@/lib/window-migration";
import { isFileMediaInfo } from "../info/media-info";
import type { MediaRemoteViewState } from "./remote-view";
import { MediaRemoteView } from "./remote-view";
import { MEDIA_WEBPAGE_VIEW_TYPE } from "./view-type";

export type MediaWebpageViewState = MediaRemoteViewState;

export class MediaWebpageView extends MediaRemoteView {
  onload(): void {
    super.onload();
    this.registerRemoteTitleChange();
    handlePaneMigration(this, () => this.render());
  }
  getViewType() {
    return MEDIA_WEBPAGE_VIEW_TYPE;
  }
  getIcon(): string {
    const host = this.getHost();
    if (host === MediaHost.Generic) {
      return "globe";
    }
    return host;
  }

  getHost(): MediaHost {
    const { source } = this.store.getState();
    if (isFileMediaInfo(source?.url))
      throw new Error("Cannot get host for file");
    if (!source?.url) return MediaHost.Generic;
    return source.url.type;
  }
  getDisplayText(): string {
    if (!this.playerTitle) return "Webpage";
    return `${this.playerTitle} - ${mediaHostDisplayName[this.getHost()]}`;
  }
}
