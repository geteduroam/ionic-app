package com.emergya.wifieapconfigurator;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;

import java.util.ArrayList;
import java.util.List;

/**
 * NetworkManagerP is the responsable of implement the abstract methods of NetworkManager. This class
 * implements the methods to work in all devices with API greater and equal than API 29.
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
public class NetworkProfileManagerSuggestions extends NetworkProfileManager {

	NetworkProfileManagerSuggestions(Context context) {
		super(context);
	}

	public void installSuggestions(ArrayList<WifiNetworkSuggestion> suggestions) throws WifiEapConfiguratorException {
		int status = wifiManager.addNetworkSuggestions(suggestions);

		if (status != 0)
			Log.d("addNetworkSuggestions", "status: " + status);

		switch (status) {
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS:
				final IntentFilter intentFilter =
					new IntentFilter(WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION);

				final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
					@Override
					public void onReceive(Context context, Intent intent) {
						if (!intent.getAction().equals(
							WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION)) {
							return; // TODO this if statement doesn't do anything..?
						}
					}
				};

				context.registerReceiver(broadcastReceiver, intentFilter);

				// TODO return "plugin.wifieapconfigurator.success.network.linked" somewhere
				break;
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_INTERNAL:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.internal");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_APP_DISALLOWED:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.app-disallowed");
			case WifiManager.STATUS_NETWORK_SUGGESTIONS_ERROR_ADD_DUPLICATE:
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
		// TODO implement
		wifiManager.removeNetworkSuggestions(new ArrayList<WifiNetworkSuggestion>());
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
