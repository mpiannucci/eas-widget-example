import { ConfigPlugin } from "@expo/config-plugins"
import { withWidgetAndroid } from "./android/withWidgetAndroid"
import { withXCodeExtensionTargets } from "./ios/withXCodeExtensionTargets"

const withAppConfigs: ConfigPlugin<WithExtensionProps> = (config, options) => {
  // config = withWidgetAndroid(config)
  config = withXCodeExtensionTargets(config, options)
  return config
}

export default withAppConfigs
