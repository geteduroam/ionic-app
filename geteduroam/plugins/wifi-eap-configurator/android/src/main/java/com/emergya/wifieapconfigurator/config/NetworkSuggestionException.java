package com.emergya.wifieapconfigurator.config;

import android.net.wifi.WifiManager;
import android.util.Log;

import java.util.List;

/**
 * An exception indication that installing {@code WifiNetworkSuggestion}s failed
 */
public class NetworkSuggestionException extends NetworkException {
	/**
	 * Construct a new exception
	 *
	 * @param status The status as returned by {@code WifiManager#addNetworkSuggestions}
	 * @see WifiManager#addNetworkSuggestions(List)
	 */
	NetworkSuggestionException(int status) {
		super(getMessageFromStatus(status));
	}

	/**
	 * Construct a new exception
	 *
	 * @param status The status as returned by {@code WifiManager#addNetworkSuggestions}
	 * @param cause  The exception that caused this error
	 * @see WifiManager#addNetworkSuggestions(List)
	 */
	NetworkSuggestionException(int status, Throwable cause) {
		super(getMessageFromStatus(status), cause);
	}

	private static String getMessageFromStatus(int status) {
		switch (status) {
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS:
				return "STATUS_NETWORK_SUGGESTIONS_SUCCESS";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_INTERNAL:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_INTERNAL";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_APP_DISALLOWED:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_APP_DISALLOWED";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_DUPLICATE:
				// On Android 11, this can't happen according to the documentation
				// On Android 10, this should not happen because we removed all networks earlier
				Log.e("NetworkSuggestionException", "STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_DUPLICATE occurred, this should not happen!");
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_DUPLICATE";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_EXCEEDS_MAX_PER_APP:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_EXCEEDS_MAX_PER_APP";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_REMOVE_INVALID:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_REMOVE_INVALID";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_NOT_ALLOWED:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_NOT_ALLOWED";
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_INVALID:
				return "STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_INVALID";
			default:
				return "UNKNOWN_ERROR";
		}
	}
}
