# Yedidim Project

This repository includes all the applications of the Yedidim project. Those applications are located inside the root directories and are:

- administration-scripts: Scripts used for administration tasks such as adding user, this probably is not updated anymore and a Angular App is going to replace those scripts with a web application (TODO: Add repo and link here)
- dispatchers-app: The React Native/Expo application for dispatchers (מוקדנים). See details on how to build it below.
- functions: This is the "backend" of the application, a firebase functions project (lambda) that is responsible for the Facebook bot implementation together with the REST API used for some of the applications and the functions triggered whenever a change is done in the database (firebase).
- dispatchers-app: The React Native/Expo ejected application for dispatchers (מוקדנים). See details on how to build it below.
- volunteers-app: The React Native/Expo ejected application for volunteers (כוננים). See details on how to build it below.
- webApp: TODO No idea what that is...

## Building dispatchers-app and volunteers-app

### Prerequisites

Make sure you have the following installed:

- node: Node.js at **version 8**, we recommend using https://github.com/creationix/nvm for linux or https://github.com/coreybutler/nvm-windows for windows to manage the versions locally
- yarn: https://yarnpkg.com/lang/en/docs/install/ (**You need to use yarn, don't use NPM, it will not work**)
- expo-cli: https://docs.expo.io/versions/latest/introduction/installation#local-development-tool-expo-cli
- XCode or Android Studio: depending on which platform you want to run the project
- **iOS only:** Install [CocoaPods](https://cocoapods.org/)

First time you clone the repository, you need to install dependencies.

```
cd dispatchers-app (or volunteers-app)
rm -rf node_modules
yarn
```

**Important: we recommend removing node_modules to avoid having package conflicts, that is specially important if you tried to use npm instead of yarn previously by mistake**

Now you need to run the development server.

```
yarn start (or expo start)
```

That will call expo-cli to start the development server locally to generate the bundle. This also updated the specific Android/iOS files to point to that specific URL on development, so don't be surprised if those files show up as modified in git after that.

#### Android

After the development server starts sucessfully, open Android Studio. Open the project inside dispatchers-app(volunteers-app)/android folder. Connect a device with USB or configure the simulator and trigger run, the project will be built using Gradle and will install the application in your device and/or simulator and call the development server.
**Important: Your device/simulator and your computer should be connected to the same Wifi network for that to work.**

#### iOS

After the development server starts sucessfully, open XCode. Open the project inside dispatchers-app(volunteers-app)/ios folder.

The first time you install the project (or if a library has been updated), you need to install the libraries using CocoaPods:

```
cd ios
pod install
```

Connect a device with USB or configure the simulator and trigger run, the project will be built using Gradle and will install the application in your device and/or simulator and call the development server.
**Important: Your device/simulator and your computer should be connected to the same Wifi network for that to work.**
