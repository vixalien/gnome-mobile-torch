/// @ts-check

// @ts-ignore
import Gio from "gi://Gio";
// @ts-ignore
import GLib from "gi://GLib";
// @ts-ignore
import GObject from "gi://GObject";

export class TorchDevice extends GObject.Object {
  static {
    GObject.registerClass({
      Properties: {
        on: GObject.param_spec_boolean(
          "on",
          "On",
          "Whether the torch is turned on",
          false,
          GObject.ParamFlags.READWRITE,
        ),
        can_scale: GObject.param_spec_boolean(
          "can-scale",
          "Can Scale",
          "Whether the torch can increase/decrease brightness",
          false,
          GObject.ParamFlags.READABLE,
        ),
        brightness: GObject.param_spec_uint(
          "brightness",
          "Brightness",
          "Brightness",
          0,
          GLib.MAXINT,
          0,
          GObject.ParamFlags.READABLE,
        ),
        scaled_brightness: GObject.param_spec_double(
          "scaled-brightness",
          "Scaled Brightness",
          "Scaled Brightness",
          0,
          1,
          0,
          GObject.ParamFlags.READWRITE,
        ),
      },
    }, this);
  }

  get name() {
    const name = this.#udev_device.get_name().split(":")[0];
    // Capitalize the name
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }

  get on() {
    return !!this.brightness;
  }

  set on(value) {
    this.toggle(value);
  }

  #can_scale = false;
  get can_scale() {
    return this.#can_scale;
  }

  #brightness = 0;
  get brightness() {
    return this.#brightness;
  }

  max_brightness = 0;

  /**
   * Gets the current brightness as fraction between 0 (off) and 1 (maximum brightness)
   */
  get scaled_brightness() {
    return this.brightness / this.max_brightness;
  }

  /**
   * Sets the current brightness as fraction between 0 (off) and 1 (maximum brightness)
   */
  set scaled_brightness(frac) {
    if (frac <= 0.0 || frac >= 1) return;

    const brightness = Math.round(frac * this.max_brightness);

    if (brightness < this.max_brightness) this.#set_brightness(brightness);
  }

  #set_brightness(brightness) {
    if (this.brightness == brightness) return;

    console.debug(`Setting brightness to ${brightness}`);

    if (!this.#dbus_proxy) return;

    const args = GLib.Variant.new("(ssu)", [
      this.#udev_device.get_subsystem(),
      this.#udev_device.get_name(),
      brightness,
    ]);

    this.#dbus_proxy.call_sync(
      "SetBrightness",
      args,
      Gio.DBusCallFlags.NONE,
      -1,
      null,
    );

    this.apply_brightness();
  }

  #last_brightness = 0;

  /**
   * @param {undefined | boolean} [value]
   */
  toggle(value) {
    const enable = typeof value === "undefined" ? !this.on : value;

    if (enable) {
      if (this.#last_brightness == 0) {
        this.#last_brightness = this.max_brightness;
        console.debug(`Last brightness: ${this.#last_brightness}`);
      }
      console.debug(`Setting torch brighness to ${this.#last_brightness}`);
      this.#set_brightness(this.#last_brightness);
    } else {
      console.debug("Disabling torch");
      this.#last_brightness = this.brightness;
      this.#set_brightness(0);
    }
  }

  /**
   * @type {any}
   */
  #udev_device = null;
  #dbus_proxy = Gio.DBusProxy.new_for_bus_sync(
    Gio.BusType.SYSTEM,
    Gio.DBusProxyFlags.NONE,
    null,
    "org.freedesktop.login1",
    "/org/freedesktop/login1/session/self",
    "org.freedesktop.login1.Session",
    null,
  );

  constructor(udev_device) {
    super();

    this.#udev_device = udev_device;

    this.max_brightness = this.#udev_device.get_sysfs_attr_as_int(
      "max_brightness",
    );

    this.#can_scale = this.max_brightness > 1;
    this.notify("can-scale");

    this.apply_brightness();
  }

  apply_brightness() {
    this.freeze_notify();

    this.#brightness = this.#udev_device.get_sysfs_attr_as_int_uncached(
      "brightness",
    );

    this.notify("brightness");
    this.notify("scaled-brightness");
    this.notify("on");

    this.thaw_notify();
  }
}
