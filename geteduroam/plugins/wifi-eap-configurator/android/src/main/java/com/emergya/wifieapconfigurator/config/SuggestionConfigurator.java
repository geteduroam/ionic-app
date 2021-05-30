package com.emergya.wifieapconfigurator.config;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.emergya.wifieapconfigurator.WifiEapConfiguratorException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * NetworkManagerP is the responsable of implement the abstract methods of NetworkManager. This class
 * implements the methods to work in all devices with API greater and equal than API 29.
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
public class SuggestionConfigurator extends AbstractConfigurator {

	public SuggestionConfigurator(Context context) {
		super(context);
	}

	@SuppressLint("SwitchIntDef")
	public void installSuggestions(ArrayList<WifiNetworkSuggestion> suggestions) throws WifiEapConfiguratorException {
		if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
			// From Android 11, suggestions may be duplicate
			// but on Android 10, we must remove suggestions first.
			// On Android 10, we cannot get our previously configured suggestions,
			// so we have to use the only other option; remove all our installed suggestions.

			removeNetwork();
		}

		int status = wifiManager.addNetworkSuggestions(suggestions);

		if (status != 0)
			Log.d("addNetworkSuggestions", "status: " + status);

		switch (status) {
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS:
				break;
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_INTERNAL:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.internal");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_APP_DISALLOWED:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.app-disallowed");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_DUPLICATE:
				// On Android 11, this can't happen according to the documentation
				// On Android 10, this should not happen because we removed all networks earlier
				Log.e(getClass().getSimpleName(), "ERROR_ADD_DUPLICATE occurred, this should not happen!");
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.add-duplicate");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_EXCEEDS_MAX_PER_APP:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.too-many");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_REMOVE_INVALID:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.remove-invalid");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_NOT_ALLOWED:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.not-allowed");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_INVALID:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.add-invalid");
			default:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.unknown");
		}
	}

	/**
	 * Remove the network of the SSID sended
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
		// Empty lisit removes all networks
		wifiManager.removeNetworkSuggestions(Collections.<WifiNetworkSuggestion>emptyList());
	}

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

	@Override
	public boolean isNetworkOverrideable(String ssid) {
		// We don't know, so go ahead!
		return true;
	}

}
