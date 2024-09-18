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
    const toggles = devices.map((device) => new TorchToggle(device));
    this._indicator = new TorchIndicator(toggles);

    Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
  }

  disable() {
    console.debug(`disabling ${this.metadata.name}`);

    this._indicator.cleanup();
    this._indicator.destroy();
    this._indicator = null;
  }
}
