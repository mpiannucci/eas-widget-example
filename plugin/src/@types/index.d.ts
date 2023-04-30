declare module "xcode"

type IosExtensionTargetType = 'watch' | 'widget' | 'complication';

type IosExtensionTarget = {
  type: IosExtensionTargetType,
  bundleId: string,
  companionAppBundleId?: string,
  name: string,
  sourceDir: string,
};

type WithExtensionProps = {
  devTeamId: string
  targets: IosExtensionTarget[]
}