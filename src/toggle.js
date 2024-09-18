import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { Slider } from "resource:///org/gnome/shell/ui/slider.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { TORCH_DISABLED_ICON, TORCH_ENABLED_ICON } from "./constants.js";

export class TorchToggle extends QuickSettings.QuickMenuToggle {
  bindings = [];

  /**
   * @param {import("./device.js").TorchDevice} device The Torch Device
   */
  constructor({ device, show_label = false, cwd }) {
    super({
      title: _("Torch"),
      subtitle: show_label ? device.name : null,
      toggle_mode: true,
    });

    this._device = device;

    if (this._device.can_scale) {
      this._sliderItem = new SliderItem();
      this.menu.box.add_child(this._sliderItem);

      this.bindings.push(
        this._device.bind_property(
          "scaled-brightness",
          this._sliderItem._slider,
          "value",
          GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL,
        ),
      );
    }

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
        "gicon",
        GObject.BindingFlags.SYNC_CREATE,
        (_, brightness) => {
          return [true, this.get_gicon(cwd, brightness)];
        },
        null,
      ),
    );
  }

  _gicon_cache = {};

  get_gicon(cwd, brightness) {
    const icon_name = brightness ? TORCH_ENABLED_ICON : TORCH_DISABLED_ICON;

    if (!this._gicon_cache[icon_name]) {
      return this._gicon_cache[icon_name] = Gio.icon_new_for_string(
        `${cwd}/data/icons/${icon_name}.svg`,
      );
    }

    return this._gicon_cache[icon_name];
  }

  cleanup() {
    this._gicon_cache = {};

    this.bindings.forEach((binding) => binding.unbind());
    this.bindings.length = 0;

    this._device.destroy();
    this._device = null;
  }

  static {
    GObject.registerClass(this);
  }
}

class SliderItem extends PopupMenu.PopupBaseMenuItem {
  constructor() {
    super({
      activate: false,
      style_class: "keyboard-brightness-item",
    });

    this._slider = new Slider(0);
    this._slider.accessible_name = _("Torch Brightness");

    this.add_child(this._slider);
  }

  static {
    GObject.registerClass({
      Properties: {
        "value": GObject.ParamSpec.double(
          "value",
          "",
          "",
          GObject.ParamFlags.READWRITE,
          0,
          1,
          0,
        ),
      },
    }, this);
  }
}
