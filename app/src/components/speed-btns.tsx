import type MxPlugin from "@/mx-main";

export function SpeedBtns({plugin}: {plugin: MxPlugin}) {
  const speedOptions = plugin.settings.getState().speedOptions
  const reordered = [...speedOptions.slice(6).reverse(), ...speedOptions.slice(0, 6)]
  return (
    <div>
      <div className="mx-speed-btns">
        {reordered.map((speed) => (
          <button
            className="keep-ob"
            key={speed}
            onClick={async () => {
              await plugin.app.commands.executeCommandById(`media-ex:set-speed-${speed}x`)
            }}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}