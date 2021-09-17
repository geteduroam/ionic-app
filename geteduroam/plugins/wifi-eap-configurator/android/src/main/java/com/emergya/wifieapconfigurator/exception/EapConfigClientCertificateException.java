package com.emergya.wifieapconfigurator.exception;

/**
 * Exception indicating that the client certificate could not be parsed
 */
public class EapConfigClientCertificateException extends EapConfigException {
	public EapConfigClientCertificateException(String message, Throwable cause) {
		super(message, cause);
	}
}
