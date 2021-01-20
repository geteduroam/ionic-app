# geteduroam ionic app

apk: check-docker
	@echo "\033[1mRemoving old previous dockers...\033[0m"
	docker-compose down --rmi all
	docker-compose rm -sfv
	@echo "\033[1mRunning docker to generate and sign APK for android...\033[0m"
	docker-compose -f docker-compose.yml up

open-xcode: check-js geteduroam/ios/App/public
	cd geteduroam && npx cap open ios
.PHONY: start-xcode

open-android: check-js geteduroam/android/app/src/main/assets/public
	cd geteduroam && npx cap open android
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
		geteduroam/node_modules geteduroam/plugins/wifi-eap-configurator/node_modules \
		geteduroam/.sourcemaps geteduroam/www  \
		geteduroam/ios/capacitor-cordova-ios-plugins geteduroam/ios/App/public \
		geteduroam/ios/App/Pods/Headers geteduroam/ios/App/Pods/Local\\ Podspecs geteduroam/ios/App/Pods/Pods.xcodeproj \
		geteduroam/ios/App/Pods/Target\\ Support\\ Files geteduroam/ios/App/Pods/Manifest.lock \
		geteduroam/android/capacitor-cordova-android-plugins geteduroam/android/app/geteduroam/main/assets/public
.PHONY: clean

# Targets

geteduroam/plugins/wifi-eap-configurator/node_modules:
	cd geteduroam/plugins/wifi-eap-configurator && npm install
	cd geteduroam && npm install ./plugins/wifi-eap-configurator --save
	cd geteduroam && npm run build

geteduroam/node_modules: check-js
	cd geteduroam && npm install

geteduroam/www: check-js geteduroam/node_modules
	cd geteduroam && npm run build

geteduroam/ios/App/public: check-js geteduroam/www
	# This also does pod install, not needed to do manually
	cd geteduroam && npx cap sync ios

geteduroam/android/app/src/main/assets/public: geteduroam/www
	cd geteduroam && npx cap sync android

# Compatibility with old make targets
generate-apk: apk
.PHONY: generate-apk
compile-plugin: geteduroam/plugins/wifi-eap-configurator/node_modules
	@echo "\033[1mPlugin compiled. Execute 'npx cap sync android' for android or 'npx cap sync ios' and go to folder /ios/App and excute 'pod install'...\033[0m"
.PHONY: compile-plugin
