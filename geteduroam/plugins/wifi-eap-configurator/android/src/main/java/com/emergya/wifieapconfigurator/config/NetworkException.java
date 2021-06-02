package com.emergya.wifieapconfigurator.config;

/**
 * Exception indicating that something went wrong with a network.
 */
public abstract class NetworkException extends Exception {
	NetworkException() {
		super();
	}

	NetworkException(String message) {
		super(message);
	}

	NetworkException(String message, Throwable cause) {
		super(message, cause);
	}

	NetworkException(Throwable cause) {
		super(cause);
	}

}
