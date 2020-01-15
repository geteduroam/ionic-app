generate-apk:
	@if [ ! -d ./.gradle ]; then \
        echo "Creating Gradle folder in Home dir"; \
        mkdir ./.gradle; \
    fi; \
    echo "Running docker to generate and sign APK for android..."; \
    docker-compose -f ../docker-compose.yml up