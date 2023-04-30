import { ConfigPlugin } from "@expo/config-plugins"
import { withWidgetXCode } from "./withWidgetXCode"

export const withWidgetIos: ConfigPlugin<WithExtensionProps> = (
  config,
  options,
) => {
  config = withWidgetXCode(config, options)
  return config
}
