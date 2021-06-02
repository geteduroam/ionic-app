package com.emergya.wifieapconfigurator.config;

/**
 * Exception to indicate an issue with a network interface, such as a configuration, albeit valid,
 * not being supported - this may happen with Passpoint.  Another example is not being able to
 * enable the interface.
 */
public class NetworkInterfaceException extends NetworkException {
	NetworkInterfaceException() {
		super();
	}

	NetworkInterfaceException(String message) {
		super(message);
	}

	NetworkInterfaceException(String message, Throwable cause) {
		super(message, cause);
	}

	NetworkInterfaceException(Throwable cause) {
		super(cause);
	}

}
