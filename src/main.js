import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { find_torch_devices } from "./manager.js";
import { TorchToggle } from "./toggle.js";
import { TorchIndicator } from "./indicator.js";

export default class TorchExtension extends Extension {
  constructor(metadata) {
    super(metadata);

    console.debug(`constructing ${this.metadata.name}`);
  }

  enable() {
    console.debug(`enabling ${this.metadata.name}`);

    const devices = find_torch_devices();

    if (devices.length == 0) return;

    // only show the name of each torch when there are more than 1
    const show_label = devices.length > 1;

    const toggles = devices.map((device) =>
      new TorchToggle(device, show_label)
    );
    this._indicator = new TorchIndicator(toggles);

    Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
  }

  disable() {
    console.debug(`disabling ${this.metadata.name}`);

    if (this._indicator) {
      this._indicator.cleanup();
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
