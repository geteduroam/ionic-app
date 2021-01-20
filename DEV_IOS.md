# Building iOS app
 

## Requirements

* [XCode](https://developer.apple.com/xcode/)
* [Node.js](https://nodejs.org/en/)
* [CocoaPods](https://cocoapods.org)

## Building

* Make sure you have the correct command line tools installed

		sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer

* Navigate to **geteduroam** folder

		cd geteduroam

* Install Dependencies and build (nodeJS dependencies)

		npm i
		npm run build

* Only if ios folder doesn't exist yet, creates it

		npx cap add ios

* Synchronize ios folder

		npx cap sync ios

* Install dependencies with CocoaPods

		( cd ios/App; pod install; )

* Start XCode

		npx cap open ios

* Press the ▶️ button to start in an emulator, you can also start on your device if your development account permits.
* To submit the app, click **Product** -> **Archive**.

## Bounce issue

To fix Bounce on iOS (this step shoulnd't be needed but sometimes the Bounce.m is removed so this is how to restore it).

* In the folder Pods/, create a "New File", select "Objective-C File", select Next.
* Include the name to the file and select Next.
* Select Target Support Files: Capacitor, Capacitor Cordova, CordovaPlugins and Pods-App
* Select Create and include:

		#import <Foundation/Foundation.h>
		#import <UIKit/UIKit.h>

		@implementation UIScrollView (NoBounce)
		- (void)didMoveToWindow {
		    [super didMoveToWindow];
		    self.bounces = NO;
		}

		@end
