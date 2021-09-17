package com.emergya.wifieapconfigurator.exception;

/**
 * Exception to indicate an issue with a network interface, such as a configuration, albeit valid,
 * not being supported - this may happen with Passpoint.  Another example is not being able to
 * enable the interface.
 */
public class NetworkInterfaceException extends NetworkException {
	public NetworkInterfaceException(String message) {
		super(message);
	}

	public NetworkInterfaceException(String message, Throwable cause) {
		super(message, cause);
	}

	public NetworkInterfaceException(Throwable cause) {
		super(cause);
	}
}
