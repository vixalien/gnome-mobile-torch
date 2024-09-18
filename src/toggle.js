import GObject from "gi://GObject";

import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { TORCH_DISABLED_ICON, TORCH_ENABLED_ICON } from "./constants.js";

export class TorchToggle extends QuickSettings.QuickToggle {
  bindings = [];

  /**
   * @param {import("./device.js").TorchDevice} device The Torch Device
   */
  constructor(device) {
    super({
      title: _("Torch"),
      subtitle: device.name,
      icon_name: get_icon_name(device.brightness),
      toggle_mode: true,
    });

    this._device = device;

    this.bindings.push(
      this._device.bind_property(
        "on",
        this,
        "checked",
        GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL,
      ),
    );

    this.bindings.push(
      this._device.bind_property_full(
        "on",
        this,
        "icon-name",
        GObject.BindingFlags.SYNC_CREATE,
        (_, brightness) => {
          return [true, get_icon_name(brightness)];
        },
        null,
      ),
    );
  }

  cleanup() {
    this.bindings.forEach((binding) => binding.unbind());
    this.bindings.length = 0;

    this._device.destroy();
    this._device = null;
  }

  static {
    GObject.registerClass(this);
  }
}

function get_icon_name(brightness) {
  return brightness ? TORCH_ENABLED_ICON : TORCH_DISABLED_ICON;
}
