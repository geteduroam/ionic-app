package com.emergya.wifieapconfigurator.config;

/**
 * Exception indicating a problem with one or more CA certificates or the chain
 */
public class EapConfigCAException extends EapConfigException {
	EapConfigCAException() {
		super();
	}

	EapConfigCAException(String message) {
		super(message);
	}

	EapConfigCAException(String message, Throwable cause) {
		super(message, cause);
	}

	EapConfigCAException(Throwable cause) {
		super(cause);
	}
}
