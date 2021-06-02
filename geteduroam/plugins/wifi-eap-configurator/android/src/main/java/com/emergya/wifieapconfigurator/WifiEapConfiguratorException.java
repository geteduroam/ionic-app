package com.emergya.wifieapconfigurator;

/**
 * An internal exception that will eventually lead to an error being reported back to capacitor
 */
class WifiEapConfiguratorException extends Exception {
	/**
	 * Create an exception with only a message
	 *
	 * @param message The message that will be relayed to capacitor
	 * @see Exception#Exception(String)
	 */
	WifiEapConfiguratorException(String message) {
		super(message);
	}

	/**
	 * Create an error with a message and a cause
	 *
	 * @param message The message that will be relayed to capacitor
	 * @param cause   The exception that caused this exception to be thrown
	 * @see Exception#Exception(String, Throwable)
	 */
	WifiEapConfiguratorException(String message, Throwable cause) {
		super(message, cause);
	}
}
