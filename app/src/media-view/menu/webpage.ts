import type { Menu } from "obsidian";
import { MediaHost } from "@/info/supported";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import type { PlayerContext } from ".";

export function webpageMenu(
  menu: Menu,
  {
    controls = true,
    toggleControls,
    player,
    source: media,
    disableWebFullscreen,
    toggleWebFullscreen,
  }: PlayerContext,
  source:
    | "player-menu-view"
    | "player-menu-embed"
    | "sidebar-context-menu"
    | "tab-header"
    | "more-options",
) {
  if (
    player.provider instanceof WebiviewMediaProvider &&
    source === "more-options"
  ) {
    menu.addItem((item) => {
      item
        .setTitle(
          controls ? "Show website native controls" : "Hide website controls",
        )
        .setSection("mx-web-player")
        .setIcon("sliders-horizontal")
        .onClick(() => {
          toggleControls(!controls);
        });
    });
    if (media.type !== MediaHost.Bilibili && media.type !== MediaHost.YouTube) {
      menu.addItem((item) => {
        item
          .setTitle(
            disableWebFullscreen
              ? "Enable in-player fullscreen"
              : "Disable in-player fullscreen",
          )
          .setSection("mx-web-player")
          .setIcon(disableWebFullscreen ? "maximize" : "minimize")
          .onClick(() => {
            toggleWebFullscreen(!!disableWebFullscreen);
          });
      });
    }
  }
}
