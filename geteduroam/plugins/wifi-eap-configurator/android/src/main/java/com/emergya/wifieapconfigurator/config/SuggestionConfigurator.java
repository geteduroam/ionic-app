package com.emergya.wifieapconfigurator.config;

import android.content.Context;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;

import java.util.Collections;
import java.util.List;

/**
 * An implementation for the configurator that uses Suggestions
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
public class SuggestionConfigurator extends AbstractConfigurator {

	public SuggestionConfigurator(Context context) {
		super(context);
	}

	public void installSuggestions(List<WifiNetworkSuggestion> suggestions) throws NetworkSuggestionException {
		if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
			// From Android 11, suggestions may be duplicate
			// but on Android 10, we must remove suggestions first.
			// On Android 10, we cannot get our previously configured suggestions,
			// so we have to use the only other option; remove all our installed suggestions.

			removeNetwork();
		}

		int status = wifiManager.addNetworkSuggestions(suggestions);

		if (status != 0) {
			Log.d("addNetworkSuggestions", "status: " + status);
			throw new NetworkSuggestionException(status);
		}

	}

	/**
	 * Remove networks with matching SSIDs
	 *
	 * @param ssids Remove network matching these SSIDs
	 */
	@Override
	public void removeNetwork(String... ssids) {
		if (ssids.length > 0 && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
			List<WifiNetworkSuggestion> suggestions = wifiManager.getNetworkSuggestions();

			for (WifiNetworkSuggestion suggestion : suggestions) {
				for (String ssid : ssids) {
					if (ssid.equals(suggestion.getSsid())) break;
				}

				suggestions.remove(suggestion);
			}

			wifiManager.removeNetworkSuggestions(suggestions);
		} else {
			removeNetwork();
		}
	}

	/**
	 * Remove all our configured networks
	 */
	public void removeNetwork() {
		// Empty list removes all networks
		wifiManager.removeNetworkSuggestions(Collections.<WifiNetworkSuggestion>emptyList());
	}

	/**
	 * Checks if a network with the given SSID is configured
	 *
	 * @param ssid Check if a network with this SSID exists
	 * @return A network with the given SSID exists
	 */
	@Override
	public boolean isNetworkConfigured(String ssid) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
			List<WifiNetworkSuggestion> installedSuggestions = wifiManager.getNetworkSuggestions();

			for (WifiNetworkSuggestion suggestion : installedSuggestions) {
				if (ssid.equals(suggestion.getSsid())) return true;
			}
		}

		// We're not sure it's not configured, but it's not configured by us
		return false;
	}

	/**
	 * Checks if the network with the given SSID can be overridden
	 *
	 * @param ssid Check if a network with this SSID can be overridden
	 * @return The network with the given SSID can be overridden
	 */
	@Override
	public boolean isNetworkOverrideable(String ssid) {
		// We don't know, so go ahead!
		return true;
	}

}
