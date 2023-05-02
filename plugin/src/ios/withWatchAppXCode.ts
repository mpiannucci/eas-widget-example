import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins"
import fs from "fs-extra"
import path from "path"
import xcode from "xcode"

const WATCH_APP_BUILD_CONFIGURATION_SETTINGS = {
    ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES: "YES",
    ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS: "NO",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    ENABLE_PREVIEWS: "YES",
    GENERATE_INFOPLIST_FILE: "YES",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks"',
    MARKETING_VERSION: "1.0",
    PRODUCT_NAME: "'$(TARGET_NAME)'",
    SDKROOT: "watchos",
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: "4",
    WATCHOS_DEPLOYMENT_TARGET: "9.4"
}

const WIDGET_BUILD_CONFIGURATION_SETTINGS = {
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME: "WidgetBackground",
    CLANG_ANALYZER_NONNULL: "YES",
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
    CLANG_CXX_LANGUAGE_STANDARD: '"gnu++17"',
    CLANG_ENABLE_OBJC_WEAK: "YES",
    CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
    CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    DEBUG_INFORMATION_FORMAT: "dwarf",
    GCC_C_LANGUAGE_STANDARD: "gnu11",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_KEY_NSHumanReadableCopyright: '""',
    IPHONEOS_DEPLOYMENT_TARGET: "14.0",
    LD_RUNPATH_SEARCH_PATHS:
        '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    MARKETING_VERSION: "1.0",
    MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
    MTL_FAST_MATH: "YES",
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: '"1"',
}

const WATCH_WIDGET_BUILD_CONFIGURATION_SETTINGS = {
    ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "AccentColor",
    ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME: "WidgetBackground",
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "42",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_KEY_NSHumanReadableCopyright: "",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks @executable_path/../../../../Frameworks"',
    MARKETING_VERSION: "1.0",
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SDKROOT: "watchos",
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: "4",
    WATCHOS_DEPLOYMENT_TARGET: "9.4",
};

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
    console.log(target);
    const targetSourceDirPath = path.join(
        projectRoot,
        target.sourceDir,
    )

    const targetFilesDir = path.join(
        platformProjectPath,
        target.name
    )
    fs.copySync(targetSourceDirPath, targetFilesDir)

    const targetFiles = ["Assets.xcassets", "Info.plist", ...target.sourceFiles];
    if (target.entitlementsFile) {
        targetFiles.push(target.entitlementsFile)
    }

    const pbxGroup = xcodeProject.addPbxGroup(
        targetFiles,
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
            targetType = "app_extension";
            break;
        default:
            break;
    };

    const newTarget = xcodeProject.addTarget(
        target.name,
        targetType,
        target.name,
        target.bundleId,
    )

    console.log(newTarget);

    // add build phase
    xcodeProject.addBuildPhase(
        target.sourceFiles,
        "PBXSourcesBuildPhase",
        "Sources",
        newTarget.uuid,
        targetType,
        target.name,
    )
    xcodeProject.addBuildPhase(
        target.frameworks,
        "PBXFrameworksBuildPhase",
        "Frameworks",
        newTarget.uuid,
        targetType,
        target.name
    )
    xcodeProject.addBuildPhase(
        [target.name + "/Assets.xcassets"],
        "PBXResourcesBuildPhase",
        "Resources",
        newTarget.uuid,
        targetType,
        target.name,
    )

    // Create CopyFiles phase in watch target (if exists)
    // THIS IS A HACK, it assumes that the complication is always 
    // listed right after the watch app, and embeds the complication
    // into the watch app 
    if (target.type === "complication") {
        const targets: string[] = getTargetUuids(xcodeProject);
        const currentIndex = targets.indexOf(newTarget.uuid);
        const watchAppIndex = currentIndex - 1;

        console.log(targets[watchAppIndex]);

        xcodeProject.addBuildPhase(
            [target.name + '.appex'],
            'PBXCopyFilesBuildPhase',
            'Embed App Extensions',
            targets[watchAppIndex],
            targetType
        );

        xcodeProject.addTargetDependency(targets[watchAppIndex], [newTarget.uuid]);
    }

    /* Update build configurations */
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()

    let extras: any = {}
    let buildSettings: any = {};

    switch (target.type) {
        case "watch":
            extras = {
                INFOPLIST_KEY_WKCompanionAppBundleIdentifier: target.companionAppBundleId,
                INFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp: "YES",
            };
            buildSettings = WATCH_APP_BUILD_CONFIGURATION_SETTINGS;
            break;
        case "widget":
            buildSettings = WIDGET_BUILD_CONFIGURATION_SETTINGS;
            break;
        case "complication":
            buildSettings = WATCH_APP_BUILD_CONFIGURATION_SETTINGS;
        default:
            break;
    };

    if (target.entitlementsFile) {
        buildSettings["CODE_SIGN_ENTITLEMENTS"] = `${target.name}/${target.entitlementsFile}`;
    }

    for (const key in configurations) {
        if (typeof configurations[key].buildSettings !== "undefined") {
            const productName = configurations[key].buildSettings.PRODUCT_NAME
            if (productName === `"${target.name}"`) {
                configurations[key].buildSettings = {
                    ...configurations[key].buildSettings,
                    ...buildSettings,
                    DEVELOPMENT_TEAM: developmentTeamId,
                    PRODUCT_BUNDLE_IDENTIFIER: target.bundleId,
                    INFOPLIST_FILE: `${target.name}/Info.plist`,
                    INFOPLIST_KEY_CFBundleDisplayName: '"${PRODUCT_NAME}"',
                    ...extras,
                }
            }
        }
    }
}

function getTargetUuids(project: any) {
    // Find target by product type
    return project.getFirstProject()['firstProject']['targets'].map((t: any) => t.value);
}