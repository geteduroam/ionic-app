FROM cangol/android-gradle

ARG NODE_VERSION=12.13.0
ARG IONIC_VERSION=6.11.0
ARG ANDROID_SDK_VERSION=28.0.3
ARG ANDROID_HOME=/opt/android-sdk-linux
ARG GRADLE_VERSION=6.0
ARG PASS_PHRASE=emergya
ARG RELEASE=1.0.0
ARG TARGET_SDK=28


ENV NODE_VERSION ${NODE_VERSION}
ENV IONIC_VERSION ${IONIC_VERSION}
ENV ANDROID_SDK_VERSION ${ANDROID_SDK_VERSION}
ENV ANDROID_HOME ${ANDROID_HOME}
ENV GRADLE_VERSION ${GRADLE_VERSION}
#ENV LOCAL_KEY_FILE ${LOCAL_KEY_FILE}
ENV PASS_PHRASE ${PASS_PHRASE}
ENV RELEASE ${RELEASE}
ENV TARGET_SDK ${TARGET_SDK}
ENV PATH $PATH:${ANDROID_HOME}/build-tools/${BUILD_TOOLS}


# Set time zone
ENV TimeZone=Europe/Stockholm
RUN ln -snf /usr/share/zoneinfo/$TimeZone /etc/localtime && echo $TimeZone > /etc/timezone

WORKDIR /home/gradle

# Install Node
RUN apt-get update &&  \
    echo y | $ANDROID_HOME/tools/android update sdk --all --filter build-tools-${ANDROID_SDK_VERSION} --no-ui && \
    apt-get install -y wget curl unzip build-essential gcc make && \
    curl --retry 3 -SLO "http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" && \
    tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 && \
    rm "node-v$NODE_VERSION-linux-x64.tar.gz" && \
    npm install -g @ionic/cli@"$IONIC_VERSION"

# Setup environment
ENV PATH ${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools:/opt/tools:/opt/gradle/gradle-"$GRADLE_VERSION"/bin

#Copy de sorce folder
COPY src/ /home/gradle/myApp/

#Copy de key from tools to sign the apk
COPY tools/release-key.jks /release-key.jks

#Copy the entrypoint from tools to let the docker work
COPY tools/entrypoint.sh /entrypoint.sh

#Run the entry point
ENTRYPOINT ["/bin/bash","/entrypoint.sh"]
