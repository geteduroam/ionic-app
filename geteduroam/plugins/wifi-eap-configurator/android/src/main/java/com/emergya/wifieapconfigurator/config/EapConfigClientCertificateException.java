package com.emergya.wifieapconfigurator.config;

/**
 * Exception indicating that the client certificate could not be parsed
 */
public class EapConfigClientCertificateException extends EapConfigException {
	EapConfigClientCertificateException() {
		super();
	}

	EapConfigClientCertificateException(String message) {
		super(message);
	}

	EapConfigClientCertificateException(String message, Throwable cause) {
		super(message, cause);
	}

	EapConfigClientCertificateException(Throwable cause) {
		super(cause);
	}
}
