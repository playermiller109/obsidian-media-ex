import type { TFile, WorkspaceLeaf } from "obsidian";
import { type FileMediaInfo } from "@/info/media-info";
import type { MediaURL } from "@/info/media-url";
import { AudioFileView, VideoFileView } from "@/media-view/file-view";
import { MediaEmbedView } from "@/media-view/iframe-view";
import { VideoUrlView, AudioUrlView } from "@/media-view/url-view";
import { MediaWebpageView } from "@/media-view/webpage-view";
import { compare } from "../note-index/def";

export function filterFileLeaf(
  leaf: WorkspaceLeaf,
  info: FileMediaInfo,
): boolean {
  if (
    !(leaf.view instanceof VideoFileView || leaf.view instanceof AudioFileView)
  ) {
    return false;
  }
  const { file: filePath } = leaf.view.getState() as { file: string };
  return filePath === info.file.path;
}

export function filterUrlLeaf(leaf: WorkspaceLeaf, info: MediaURL): boolean {
  if (
    !(
      leaf.view instanceof MediaEmbedView ||
      leaf.view instanceof MediaWebpageView ||
      leaf.view instanceof VideoUrlView ||
      leaf.view instanceof AudioUrlView
    )
  ) {
    return false;
  }
  const { source } = leaf.view.store.getState();
  return compare(source?.url, info);
}

export function sortByMtime(a: TFile, b: TFile) {
  const aDate = a.stat.mtime;
  const bDate = b.stat.mtime;
  if (!aDate || !bDate) return 0;
  return bDate - aDate;
}
