/// @ts-check

// @ts-ignore
import GUdev from "gi://GUdev";

import { TorchDevice } from "./device.js";

export function find_torch_devices() {
  // const udev_client = GUdev.Client.new([TORCH_SUBSYSTEM]);
  const udev_client = GUdev.Client.new([]);

  const enumerator = GUdev.Enumerator.new(udev_client);
  // enumerator.add_match_subsystem(TORCH_SUBSYSTEM);
  // enumerator.add_match_name("*:torch");
  // enumerator.add_match_name("*:flash");
  enumerator.add_match_name("*_backlight");

  const device_list = enumerator.execute();
  if (device_list.length == 0) {
    console.debug("Failed to find a torch device");
    return [];
  }

  for (const device of device_list) {
    console.debug(
      `Found torch device ${device.get_name()} with max brightness ${
        device.get_sysfs_attr_as_int(
          "max_brightness",
        )
      }`,
    );
  }

  return device_list.map((device) => new TorchDevice(device));
}
