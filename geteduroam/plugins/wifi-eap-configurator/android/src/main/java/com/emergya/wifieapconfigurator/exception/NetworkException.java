package com.emergya.wifieapconfigurator.exception;

/**
 * Exception indicating that something went wrong with a network.
 */
public abstract class NetworkException extends Exception {
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
