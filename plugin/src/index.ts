import { ConfigPlugin } from "@expo/config-plugins"
import { withXCodeExtensionTargets } from "./ios/withXCodeExtensionTargets"

const withAppConfigs: ConfigPlugin<WithExtensionProps> = (config, options) => {
  config = withXCodeExtensionTargets(config, options)
  return config
}

export default withAppConfigs
