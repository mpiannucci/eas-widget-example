declare module "xcode"

type IosExtensionTargetType = 'watch' | 'widget' | 'complication';

type IosExtensionTarget = {
  type: IosExtensionTargetType,
  bundleId: string,
  companionAppBundleId?: string,
  name: string,
  displayName?: string,
  sourceDir: string,
  sourceFiles: string[],
  entitlementsFile?: string,
  frameworks: string[],
};

type WithExtensionProps = {
  devTeamId: string
  targets: IosExtensionTarget[]
}