generate-apk:
	@if [ ! -d ./.gradle ]; then \
        echo "Creating Gradle folder in Home dir"; \
        mkdir ./.gradle; \
    fi; \
    echo "Removing old previous dockers..."; \
    docker-compose down --rmi all; \
    docker-compose rm -sfv; \
    echo "Running docker to generate and sign APK for android..."; \
    docker-compose -f ../docker-compose.yml up
compile-plugin:
	@echo "Compiling wifi-eap-configurator plugin..."; \
    cd ../src/plugins/wifi-eap-configurator; \
    npm install; \
    cd ../..; \
    npm install ./plugins/wifi-eap-configurator --save; \
    npm run build; \
    echo "Plugin compiled. Execute 'npx cap sync android' for android or 'npx cap sync ios' and go to folder /ios/App and excute 'pod install'..."
