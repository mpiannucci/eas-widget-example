import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins"
import fs from "fs-extra"
import path from "path"
import xcode from "xcode"

const WATCHAPP_TARGET_NAME = "watch"

const TOP_LEVEL_FILES = ["Assets.xcassets", "Info.plist", "watchApp.swift"]

const BUILD_CONFIGURATION_SETTINGS = {
    ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES: "YES",
    ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS: "NO",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    ENABLE_PREVIEWS: "YES",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_FILE: "watch/Info.plist",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks"',
    MARKETING_VERSION: "1.0",
    PRODUCT_NAME: "watch",
    SDKROOT: "watchos",
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: "4",
    WATCHOS_DEPLOYMENT_TARGET: "9.4"
}

export const withWatchAppXCode: ConfigPlugin<WithExtensionProps> = (
    config,
    options: WithExtensionProps,
) => {
    return withXcodeProject(config, async newConfig => {
        try {
            const projectName = newConfig.modRequest.projectName
            const projectRoot = newConfig.modRequest.projectRoot
            const platformProjectPath = newConfig.modRequest.platformProjectRoot
            const bundleId = config.ios?.bundleIdentifier || ""
            const projectPath = `${newConfig.modRequest.platformProjectRoot}/${projectName}.xcodeproj/project.pbxproj`

            await updateXCodeProj(projectRoot, projectPath, platformProjectPath, options.devTeamId, options.targets)
            return newConfig
        } catch (e) {
            console.error(e)
            throw e
        }
    })
}

async function updateXCodeProj(
    projectRoot: string,
    projectPath: string,
    platformProjectPath: string,
    developmentTeamId: string,
    targets: IosExtensionTarget[],
) {
    const xcodeProject = xcode.project(projectPath);

    xcodeProject.parse(() => {
        targets.forEach(target => addXcodeTarget(xcodeProject, projectRoot, platformProjectPath, developmentTeamId, target))
        fs.writeFileSync(projectPath, xcodeProject.writeSync())
    });
}

async function addXcodeTarget(
    xcodeProject: any,
    projectRoot: string,
    platformProjectPath: string,
    developmentTeamId: string,
    target: IosExtensionTarget,
) {
    const targetSourceDirPath = path.join(
        projectRoot,
        target.sourceDir,
    )

    const targetFilesDir = path.join(
        platformProjectPath,
        target.name
    )
    fs.copySync(targetSourceDirPath, targetFilesDir)

    const pbxGroup = xcodeProject.addPbxGroup(
        TOP_LEVEL_FILES,
        target.name,
        target.name,
    )

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects.PBXGroup
    Object.keys(groups).forEach(function (groupKey) {
        if (groups[groupKey].name === undefined) {
            xcodeProject.addToPbxGroup(pbxGroup.uuid, groupKey)
        }
    })

    // // WORK AROUND for codeProject.addTarget BUG
    // // Xcode projects don't contain these if there is only one target
    // // An upstream fix should be made to the code referenced in this link:
    // //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects
    projObjects["PBXTargetDependency"] =
        projObjects["PBXTargetDependency"] || {}
    projObjects["PBXContainerItemProxy"] =
        projObjects["PBXTargetDependency"] || {}

    // // add target
    // use application not watch2_app https://stackoverflow.com/a/75432468
    let targetType = "application";
    switch (target.type) {
        case "widget":
            targetType = "app_extension";
            break;
        case "complication":
            targetType = "watch2_extension";
            break;
        case "watch":
        default:
            break;
    };

    const newTarget = xcodeProject.addTarget(
        target.name,
        targetType,
        target.name,
        target.bundleId,
    )

    console.log(`watchTarget: ${JSON.stringify(newTarget)}`);

    // add build phase
    xcodeProject.addBuildPhase(
        target.sourceFiles,
        "PBXSourcesBuildPhase",
        "Sources",
        newTarget.uuid,
        undefined,
        target.name,
    )
    xcodeProject.addBuildPhase(
        target.frameworks,
        "PBXFrameworksBuildPhase",
        "Frameworks",
        newTarget.uuid,
    )
    const resourcesBuildPhase = xcodeProject.addBuildPhase(
        ["Assets.xcassets"],
        "PBXResourcesBuildPhase",
        "Resources",
        newTarget.uuid,
        undefined,
        target.name,
    )

    /* Update build configurations */
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()

    let extras = {}

    switch (target.type) {
        case "watch":
            extras = {
                INFOPLIST_KEY_WKCompanionAppBundleIdentifier: target.companionAppBundleId,
                INFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp: "YES",
            };
            break;
        default:
            break;
    };

    for (const key in configurations) {
        if (typeof configurations[key].buildSettings !== "undefined") {
            const productName = configurations[key].buildSettings.PRODUCT_NAME
            if (productName === `"${WATCHAPP_TARGET_NAME}"`) {
                configurations[key].buildSettings = {
                    ...configurations[key].buildSettings,
                    ...BUILD_CONFIGURATION_SETTINGS,
                    DEVELOPMENT_TEAM: developmentTeamId,
                    PRODUCT_BUNDLE_IDENTIFIER: target.bundleId,
                    ...extras,
                }
            }
        }
    }
}
