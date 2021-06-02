package com.emergya.wifieapconfigurator.config;

/**
 * Exception indicating an error in the parsed eap-config profile
 *
 * This can either be due to a problem in the eap-config file, or due to the parser in ionic.
 */
public class EapConfigException extends Exception {
	EapConfigException() {
		super();
	}

	EapConfigException(String message) {
		super(message);
	}

	EapConfigException(String message, Throwable cause) {
		super(message, cause);
	}

	EapConfigException(Throwable cause) {
		super(cause);
	}
}
