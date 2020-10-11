# geteduroam ionic app

apk: check-docker
	@echo "\033[1mRemoving old previous dockers...\033[0m"
	docker-compose down --rmi all
	docker-compose rm -sfv
	@echo "\033[1mRunning docker to generate and sign APK for android...\033[0m"
	docker-compose -f docker-compose.yml up

src/plugins/wifi-eap-configurator/node_modules:
	cd src/plugins/wifi-eap-configurator && npm install
	cd src && npm install ./plugins/wifi-eap-configurator --save
	cd src && npm run build

src/node_modules: check-js
	cd src && npm install

src/www: check-js src/node_modules
	cd src && npm run build

src/ios/App/public: check-js src/www
	# This also does pod install, not needed to do manually
	cd src && npx cap sync ios

src/android/app/src/main/assets/public:
	cd src && npx cap sync android

open-xcode: check-js src/ios/App/public
	cd src && npx cap open ios
.PHONY: start-xcode

open-android: check-js src/android/app/src/main/assets/public
.PHONY: start-android

# Dependency checking
check-docker:
	@docker ps >/dev/null
.PHONY: check-docker

check-js:
	@npm version >/dev/null
	@npx --version >/dev/null

# Common operations
clean:
	rm -rf apk \
		src/node_modules src/plugins/wifi-eap-configurator/node_modules \
		src/.sourcemaps src/www  \
		src/ios/capacitor-cordova-ios-plugins src/ios/App/public \
		src/ios/App/Pods/Headers src/ios/App/Pods/Local\\ Podspecs src/ios/App/Pods/Pods.xcodeproj \
		src/ios/App/Pods/Target\\ Support\\ Files src/ios/App/Pods/Manifest.lock \
		src/android/capacitor-cordova-android-plugins src/android/app/src/main/assets/public
.PHONY: clean

# Compatibility with old make targets
generate-apk: apk
.PHONY: generate-apk
compile-plugin: src/plugins/wifi-eap-configurator/node_modules
	@echo "\033[1mPlugin compiled. Execute 'npx cap sync android' for android or 'npx cap sync ios' and go to folder /ios/App and excute 'pod install'...\033[0m"
.PHONY: compile-plugin
