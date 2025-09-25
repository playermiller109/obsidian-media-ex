import type { VTTCue } from "media-captions";
import MiniSearch from "minisearch";
import { Notice, htmlToMarkdown } from "obsidian";
import { createContext, useContext } from "react";
// eslint-disable-next-line import/no-deprecated
import { createStore, useStore } from "zustand";
import type { MediaInfo } from "@/info/media-info";
import { MediaURL } from "@/info/media-url";
import type { ParsedTextTrack } from "@/info/track-info";
import { formatDuration } from "@/lib/hash/format";
import { langCodeToLabel, vaildate } from "@/lib/lang/lang";
import { compare } from "@/media-note/note-index/def";
import { timestampGenerator } from "@/media-note/timestamp/utils";
import type MxPlugin from "@/mx-main";
import { isModEvent } from "@/patch/mod-evt";
import type { MxSettings } from "@/settings/def";
import "./style.less";
import type { VTTContent, VTTCueWithId } from "../handle/type";

interface TranscriptViewState {
  media: MediaInfo | null;
  showSearchBox: boolean;
  title: string | null;
  toggleSearchBox(val?: boolean): void;
  activeCueIDs: Set<string>;
  updateActiveCues: (cueIds: string[]) => void;
  textTrack: {
    _minisearch: MiniSearch<VTTCue> | null;
    content: VTTContent;
    id: string;
    locales: string[];
  } | null;
  setLinkedMedia(media: MediaInfo | null): boolean;
  setCaptions(
    result: {
      id: string;
      track: ParsedTextTrack;
      locales: string[];
    } | null,
  ): void;
  search(
    query: string,
    options?: Partial<{ fuzzy: boolean; prefix: boolean }>,
  ): CueSearchResult[];
}

export interface CueSearchResult {
  matches: string[];
  score: number;
  queryTerms: string[];
  id: string;
}

export function createTranscriptViewStore() {
  const store = createStore<TranscriptViewState>((set, get, _store) => ({
    source: null,
    title: null,
    showSearchBox: false,
    media: null,
    activeCueIDs: new Set(),
    updateActiveCues(cueIds) {
      const prev = get().activeCueIDs;
      const now = new Set(cueIds);
      if (prev.size === now.size && [...prev].every((id) => now.has(id)))
        return;
      set({ activeCueIDs: now });
    },
    setLinkedMedia(media) {
      const prev = get().media;
      if (compare(prev, media)) return false;
      set({ media });
      return true;
    },
    toggleSearchBox(val) {
      if (typeof val === "boolean") {
        set({ showSearchBox: val });
      } else {
        set(({ showSearchBox: prev }) => ({ showSearchBox: !prev }));
      }
    },
    textTrack: null,
    setCaptions(info) {
      if (!info) {
        set({ textTrack: null, title: null });
        return;
      }
      const { track, locales } = info;
      const { metadata: meta, cues } = track.content;
      const label = meta.Label || track.label;
      const lang = meta.Language || track.language;
      let title = label || (vaildate(lang) ? langCodeToLabel(lang) : "");
      if (title && meta.Title) {
        title = meta.Title + " - " + title;
      }
      set({ title: title ?? null });
      get().textTrack?._minisearch?.removeAll();
      const segmenter = getSegmenter(...info.locales);
      const minisearch = new MiniSearch<VTTCueWithId>({
        idField: "id",
        fields: ["text"],
        tokenize: segmenter
          ? (text) =>
              [...segmenter.segment(text)]
                .filter((s) => s.isWordLike)
                .map((seg) => seg.segment)
          : undefined,
      });
      minisearch.addAll(cues);
      set({
        textTrack: {
          _minisearch: minisearch,
          locales,
          content: track.content,
          id: info.id,
        },
      });
    },
    search(query, options) {
      const minisearch = get().textTrack?._minisearch;
      if (!minisearch) return [];
      const result = minisearch.search(query, options);
      return result.map((r) => ({
        matches: Object.keys(r.match),
        queryTerms: r.queryTerms,
        score: r.score,
        id: r.id,
      }));
    },
  }));
  return store;
}

function getSegmenter(...locales: string[]) {
  // feature detect for window.Intl and Intl.Segmenter
  if (
    typeof window.Intl === "undefined" ||
    typeof Intl.Segmenter === "undefined"
  ) {
    return null;
  }
  return new Intl.Segmenter(locales, { granularity: "word" });
}

export type TranscriptViewStoreApi = ReturnType<
  typeof createTranscriptViewStore
>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TranscriptViewContext = createContext<{
  store: TranscriptViewStoreApi;
  plugin: MxPlugin;
}>(null as any);

export function useTranscriptViewStore<U>(
  selector: (state: TranscriptViewState) => U,
): U {
  const { store } = useContext(TranscriptViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(store, selector);
}

export function useSettings<U>(selector: (state: MxSettings) => U): U {
  const {
    plugin: { settings },
  } = useContext(TranscriptViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(settings, selector);
}
export function usePlugin() {
  const { plugin } = useContext(TranscriptViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return plugin;
}

export function useSearch() {
  const minisearchReady = useTranscriptViewStore(
    (s) => !!s.textTrack?._minisearch,
  );
  const search = useTranscriptViewStore((s) => s.search);
  return minisearchReady ? search : null;
}

export function useSearchBox() {
  const showSearchBox = useTranscriptViewStore((s) => s.showSearchBox);
  const toggleSearchBox = useTranscriptViewStore((s) => s.toggleSearchBox);
  return [showSearchBox, toggleSearchBox] as const;
}

export function usePlay() {
  const plugin = usePlugin();
  const media = useTranscriptViewStore((s) => s.media);
  if (!media) return;
  return async (evt: React.MouseEvent | React.KeyboardEvent, time: number) => {
    const forLink = media instanceof MediaURL ? media.clone() : { ...media };
    forLink.hash = `#t=${time}`;
    await plugin.leafOpener.openMedia(forLink, isModEvent(evt.nativeEvent), {
      fromUser: true,
    });
  };
}

export function useTimestampLink() {
  const plugin = usePlugin();
  const media = useTranscriptViewStore((s) => s.media);
  if (!media)
    return function (time: number, text: string) {
      const mainText = htmlToMarkdown(`<pre>${text}</pre>`);
      const timestamp = formatDuration(time);
      return { text: `${timestamp} ${mainText}`, timestamp };
    };
  return function (time: number, text: string) {
    const genTimestamp = timestampGenerator(time, media, {
      app: plugin.app,
      settings: plugin.settings.getState(),
    });
    const timestamp = genTimestamp("");
    const mainText = htmlToMarkdown(`<pre>${text}</pre>`);
    return { text: `${timestamp} ${mainText}`, timestamp };
  };
}

export function useCopy() {
  const buildTimestampLink = useTimestampLink();
  return async (
    _: React.MouseEvent | React.KeyboardEvent,
    time: number,
    text: string,
  ) => {
    const { text: content, timestamp } = await buildTimestampLink(time, text);
    await navigator.clipboard.writeText(content);
    new Notice(`Copied at ${timestamp} to clipboard`);
  };
}
