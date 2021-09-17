package com.emergya.wifieapconfigurator.exception;

/**
 * Exception indicating a value in the provided configuration is missing or doesn't match a constraint
 */
public class EapConfigValueException extends EapConfigException {
	public EapConfigValueException(String message) {
		super(message);
	}

	public EapConfigValueException(String message, Throwable cause) {
		super(message, cause);
	}

	public EapConfigValueException(Throwable cause) {
		super(cause);
	}
}
