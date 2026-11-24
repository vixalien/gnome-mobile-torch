import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Clutter from "gi://Clutter";
import St from "gi://St";

import { Slider } from "resource:///org/gnome/shell/ui/slider.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { TORCH_DISABLED_ICON, TORCH_ENABLED_ICON } from "./constants.js";

export class TorchToggle extends QuickSettings.QuickMenuToggle {
  bindings = [];
  _signal_handlers = [];
  _syncing = false;

  /**
   * @param {{ devices: import("./device.js").TorchDevice[], cwd: string }} options
   */
  constructor({ devices, cwd }) {
    super({
      title: _("Torch"),
      toggle_mode: true,
    });

    this._devices = devices;
    this._cwd = cwd;

    // Add one labelled brightness slider per torch to the expanded menu.
    for (const device of this._devices) {
      if (!device.can_scale) continue;

      const slider_item = new SliderItem(device.name);
      this.menu.box.add_child(slider_item);

      this.bindings.push(
        device.bind_property(
          "scaled-brightness",
          slider_item._slider,
          "value",
          GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL,
        ),
      );
    }

    // The single tile reflects whether any of the torches is on.
    for (const device of this._devices) {
      this._signal_handlers.push([
        device,
        device.connect("notify::on", () => this._sync_checked()),
      ]);
    }

    this._signal_handlers.push([
      this,
      this.connect("notify::checked", () => this._on_checked_changed()),
    ]);

    this._sync_checked();
    this._sync_icon();
  }

  _sync_checked() {
    if (this._syncing) return;

    this._syncing = true;
    this.checked = this._devices.some((device) => device.on);
    this._syncing = false;
  }

  _on_checked_changed() {
    if (this._syncing) return;

    this._syncing = true;
    this._devices.forEach((device) => {
      device.on = this.checked;
    });
    this._syncing = false;

    this._sync_icon();
  }

  _sync_icon() {
    this.gicon = this.get_gicon(
      this._cwd,
      this._devices.some((device) => device.on),
    );
  }

  _gicon_cache = {};

  get_gicon(cwd, brightness) {
    const icon_name = brightness ? TORCH_ENABLED_ICON : TORCH_DISABLED_ICON;

    if (!this._gicon_cache[icon_name]) {
      return (this._gicon_cache[icon_name] = Gio.icon_new_for_string(
        `${cwd}/data/icons/${icon_name}.svg`,
      ));
    }

    return this._gicon_cache[icon_name];
  }

  cleanup() {
    this._gicon_cache = {};

    this._signal_handlers.forEach(([object, handler_id]) => {
      object.disconnect(handler_id);
    });
    this._signal_handlers.length = 0;

    this.bindings.forEach((binding) => binding.unbind());
    this.bindings.length = 0;

    // this._devices.forEach((device) => device.destroy());
    this._devices = null;
  }

  static {
    GObject.registerClass(this);
  }
}

class SliderItem extends PopupMenu.PopupBaseMenuItem {
  constructor(label) {
    super({
      activate: false,
      style_class: "keyboard-brightness-item",
    });

    this._slider = new Slider(0);
    this._slider.accessible_name = _("%s Torch Brightness").format(label);
    this._slider.x_expand = true;

    const box = new St.BoxLayout({
      x_expand: true,
      style: "spacing: 8px;",
    });

    const label_actor = new St.Label({
      text: label,
      y_align: Clutter.ActorAlign.CENTER,
      style: "min-width: 4em;",
    });

    box.add_child(label_actor);
    box.add_child(this._slider);

    this.add_child(box);
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
