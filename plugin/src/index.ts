import { ConfigPlugin } from "@expo/config-plugins"
import { withWidgetAndroid } from "./android/withWidgetAndroid"
import { withWatchAppXCode } from "./ios/withWatchAppXCode"
import { withWidgetIos } from "./ios/withWidgetIos"

const withAppConfigs: ConfigPlugin<WithExtensionProps> = (config, options) => {
  // config = withWidgetAndroid(config)
  // config = withWidgetIos(config, options)
  config = withWatchAppXCode(config, options)
  return config
}

export default withAppConfigs
