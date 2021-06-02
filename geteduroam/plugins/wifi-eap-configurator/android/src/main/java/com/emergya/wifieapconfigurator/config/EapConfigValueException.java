package com.emergya.wifieapconfigurator.config;

/**
 * Exception indicating a value in the provided configuration is missing or doesn't match a constraint
 */
public class EapConfigValueException extends EapConfigException {
	EapConfigValueException() {
		super();
	}

	EapConfigValueException(String message) {
		super(message);
	}

	EapConfigValueException(String message, Throwable cause) {
		super(message, cause);
	}

	EapConfigValueException(Throwable cause) {
		super(cause);
	}
}
