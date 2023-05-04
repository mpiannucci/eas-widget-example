
Here is an example of adding a Widget, Watch App, and Watch App Complication in Expo's Managed Workflow (EAS).


| Android | iOS |
|:-----------:|:------------:|
|<img width="280" src="./images/homescreen-android.png" />|<img width="280" src="./images/homescreen-ios.png" />|



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




