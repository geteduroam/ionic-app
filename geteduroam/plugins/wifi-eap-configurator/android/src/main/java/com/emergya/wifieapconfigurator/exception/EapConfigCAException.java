package com.emergya.wifieapconfigurator.exception;

/**
 * Exception indicating a problem with one or more CA certificates or the chain
 */
public class EapConfigCAException extends EapConfigException {
	public EapConfigCAException(String message, Throwable cause) {
		super(message, cause);
	}
}
