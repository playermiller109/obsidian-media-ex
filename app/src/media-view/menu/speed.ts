import type { MediaPlayerInstance } from "@vidstack/react";
import type { MenuItem } from "obsidian";
import type MxPlugin from "@/mx-main";
import { PlaybackSpeedPrompt } from "./prompt";

export function speedMenu(plugin: MxPlugin, item: MenuItem, player: MediaPlayerInstance) {
  const speedOptions = plugin.settings.getState().speedOptions
  const currentSpeed = player.state.playbackRate;

  const isCustomSpeed = !speedOptions.includes(currentSpeed);

  function speedLabel(speed: number) {
    const speedLabel = new DocumentFragment();
    speedLabel.appendText("Speed ");
    speedLabel.createEl("code", { text: `(${speed}x)` });
    return speedLabel;
  }
  const sub = item
    .setTitle(speedLabel(currentSpeed))
    .setIcon("gauge")
    .setSection("mx-player")
    .setSubmenu();
  speedOptions.forEach((speed) =>
    sub.addItem((item) =>
      item
        .setTitle(`${speed}x`)
        .setChecked(speed === currentSpeed)
        .onClick(() => {
          player.playbackRate = speed;
        }),
    ),
  );

  function customSpeedLabel(speed: number) {
    const customSpeedLabel = new DocumentFragment();
    customSpeedLabel.appendText("Custom");
    if (!speedOptions.includes(speed)) {
      customSpeedLabel.appendText(" ");
      customSpeedLabel.createEl("code", { text: `(${speed}x)` });
    } else {
      customSpeedLabel.appendText("...");
    }
    return customSpeedLabel;
  }
  sub.addItem((item) =>
    item
      .setTitle(customSpeedLabel(currentSpeed))
      .setChecked(isCustomSpeed)
      .onClick(async () => {
        const newSpeed = await PlaybackSpeedPrompt.run();
        if (!newSpeed) return;
        player.playbackRate = newSpeed;
      }),
  );
}
