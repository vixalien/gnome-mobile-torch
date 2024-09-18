/// @ts-check

// @ts-ignore
import GUdev from "gi://GUdev";

import { TorchDevice } from "./device.js";
import { TORCH_NAME_FILTERS, TORCH_SUBSYSTEMS } from "./constants.js";

export function find_torch_devices() {
  const udev_client = GUdev.Client.new(TORCH_SUBSYSTEMS);

  const enumerator = GUdev.Enumerator.new(udev_client);

  for (const subsystem of TORCH_SUBSYSTEMS) {
    enumerator.add_match_subsystem(subsystem);
  }

  for (const filter of TORCH_NAME_FILTERS) {
    enumerator.add_match_name(filter);
  }

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
