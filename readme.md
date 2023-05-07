
An example of adding a Widget, Watch App, and Watch App Complication in Expo's Managed Workflow (EAS).

| ios | watchos app | watchos complication|
|:-----------:|:------------:|:------------:|
|<img width="200" src="./images/homescreen.png" />|<img width="200" src="./images/watchapp.png" />|<img width="200" src="./images/complication.png" />|

## Folders

- plugin: Config Plugins
- widget: Template files for widget
- watch: Template files for watch app
- complication: Template files for watch app complication

## Set up

### Install

`yarn install`


### Edit app.json

Edit following fields.

- `android.package`
- `ios.bundleIdentifier`
- `extra.eas.build.experimental.ios.appExtensions`
- `<APPLE_DEV_TEAM_ID>` in `plugins`

Update the entitlements file to match your app group you have enabled for your team. Otherwise disbale the entitlements 
sections to not use default app groups

## Run on Local

```
yarn android
# or
yarn ios
```

## Build on Server (EAS)

```
eas build --platform all --profile preview
```

## TODO

Get shared files working between targets, whether just copying or actually copying once and sharing the file between targets
