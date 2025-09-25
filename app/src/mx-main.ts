import "@total-typescript/ts-reset";
import "@vidstack/react/player/styles/base.css";
import "./style.css";
import "./icons";

import type { PaneType, SplitDirection } from "obsidian";
import { Notice, Plugin } from "obsidian";
import { RecorderNote } from "./audio-rec";
import type { MediaInfo } from "./info/media-info";
import { getMediaExts } from "./info/media-type";
import { URLViewType } from "./info/view-type";
import { toURL } from "./lib/url";
import { initLogin } from "./login";
import { handleMediaNote } from "./media-note";
import { LeafOpener } from "./media-note/leaf-open";
import {
  onExternalLinkClick,
  onInternalLinkClick,
} from "./media-note/link-click";
import { MediaNoteIndex } from "./media-note/note-index/indexer";
import { PlaylistIndex } from "./media-note/playlist";
import { MediaFileEmbed } from "./media-view/file-embed";
import { AudioFileView, VideoFileView } from "./media-view/file-view";
import { MediaEmbedView } from "./media-view/iframe-view";
import registerMediaMenu from "./media-view/menu";
import { AudioUrlView, VideoUrlView } from "./media-view/url-view";
import {
  MEDIA_FILE_VIEW_TYPE,
  MEDIA_WEBPAGE_VIEW_TYPE,
  MEDIA_EMBED_VIEW_TYPE,
  MEDIA_URL_VIEW_TYPE,
} from "./media-view/view-type";
import { MediaWebpageView } from "./media-view/webpage-view";
import injectMediaEmbed from "./patch/embed";
import patchEditorClick from "./patch/link.editor";
import patchInlineUrl from "./patch/link.inline-field";
import patchLinktextOpen from "./patch/link.internal";
import fixLinkLabel from "./patch/link.label-fix";
import patchPreviewClick from "./patch/link.preview";
import injectMediaView from "./patch/view";
import { patchWin32FileUrl } from "./patch/win-file-url";
import { createSettingsStore } from "./settings/def";
import { MxSettingTabs } from "./settings/tab";
import { initSwitcher } from "./switcher";
import { registerTranscriptView } from "./transcript";
import { TranscriptLoader } from "./transcript/handle/loader";
import { WebviewPreload } from "./web/preload";
import { modifySession } from "./web/session";
import { resolveMxProtocol } from "./web/url-match";
import "./login/modal";

interface MxAPI {
  openUrl: (
    url: string,
    newLeaf?: PaneType,
    direction?: SplitDirection,
  ) => Promise<void>;
}

export default class MxPlugin extends Plugin {
  settings = createSettingsStore(this);

  transcript = this.addChild(new TranscriptLoader(this));

  resolveUrl(url: string | URL | null | undefined): MediaInfo | null {
    const patched = patchWin32FileUrl(url);
    if (!patched) return null;
    return resolveMxProtocol(
      toURL(patched),
      this.settings.getState(),
      this.app,
    );
  }
  api: MxAPI = {
    openUrl: async (url, newLeaf, direction) => {
      const urlInfo = this.resolveUrl(url);
      if (!urlInfo) {
        new Notice("Protocol not yet supported");
        return;
      }
      await this.leafOpener.openMedia(urlInfo, newLeaf, {
        direction,
      });
    },
  };

  urlViewType = this.addChild(new URLViewType(this));

  async onload() {
    this.addSettingTab(new MxSettingTabs(this));
    await this.loadSettings();
    this.initLogin();
    this.loadPatches();
    this.registerMediaMenu();
    this.handleMediaNote();
    registerTranscriptView(this);
    await this.modifySession();
    initSwitcher(this);
  }

  async loadSettings() {
    await this.settings.getState().load();
  }

  mediaNote = this.addChild(new MediaNoteIndex(this));
  playlist = this.addChild(new PlaylistIndex(this));
  preload = this.addChild(new WebviewPreload(this));
  leafOpener = this.addChild(new LeafOpener(this));
  recorderNote = this.addChild(new RecorderNote(this));
  handleMediaNote = handleMediaNote;
  injectMediaEmbed = injectMediaEmbed;
  injectMediaView = injectMediaView;
  registerMediaMenu = registerMediaMenu;
  fixLinkLabel = fixLinkLabel;
  patchEditorClick = patchEditorClick;
  patchPreviewClick = patchPreviewClick;
  patchInlineUrl = patchInlineUrl;
  patchLinktextOpen = patchLinktextOpen;
  modifySession = modifySession;
  initLogin = initLogin;

  private loadPatches() {
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.audio,
      (leaf) => new AudioFileView(leaf, this),
      getMediaExts("audio"),
    );
    this.injectMediaView(
      MEDIA_FILE_VIEW_TYPE.video,
      (leaf) => new VideoFileView(leaf, this),
      getMediaExts("video"),
    );
    this.injectMediaEmbed(
      (info, file, subpath) => new MediaFileEmbed(info, file, subpath, this),
    );
    this.registerView(
      MEDIA_WEBPAGE_VIEW_TYPE,
      (leaf) => new MediaWebpageView(leaf, this),
    );
    this.registerView(
      MEDIA_EMBED_VIEW_TYPE,
      (leaf) => new MediaEmbedView(leaf, this),
    );
    this.registerView(
      MEDIA_URL_VIEW_TYPE.video,
      (leaf) => new VideoUrlView(leaf, this),
    );
    this.registerView(
      MEDIA_URL_VIEW_TYPE.audio,
      (leaf) => new AudioUrlView(leaf, this),
    );

    this.patchEditorClick({ onExternalLinkClick });
    this.patchPreviewClick({ onExternalLinkClick });
    this.fixLinkLabel();
    this.patchInlineUrl();
    this.patchLinktextOpen({ onInternalLinkClick });
  }
}
