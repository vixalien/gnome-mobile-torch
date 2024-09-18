import GObject from "gi://GObject";

import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

export class TorchIndicator extends QuickSettings.SystemIndicator {
  constructor(toggles) {
    super();

    this.quickSettingsItems.push(...toggles);
  }

  cleanup() {
    this.quickSettingsItems.forEach((item) => {
      item.cleanup();
      item.destroy();
    });
  }

  static {
    GObject.registerClass(this);
  }
}
