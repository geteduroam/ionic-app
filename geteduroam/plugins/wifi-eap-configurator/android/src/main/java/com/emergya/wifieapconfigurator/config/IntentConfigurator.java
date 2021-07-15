package com.emergya.wifieapconfigurator.config;

import android.content.Context;
import android.content.Intent;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.RequiresApi;

import java.util.ArrayList;
import java.util.List;

/**
 * A configurator using intents
 *
 * Intents will create the network in the WiFi app just like other WiFi networks.
 * This is the most natural behaviour for the end user.
 * If a network is created that already exists, the network is overridden (*)
 *
 * It does not appear to be possible to remove networks after they have been created.
 * This is especially problematic for Passpoint networks;
 *
 * (*) on some devices, Passpoint networks are not overridden
 */
@RequiresApi(api = Build.VERSION_CODES.R)
public class IntentConfigurator extends SuggestionConfigurator {
	public IntentConfigurator(Context context) {
		super(context);
	}

	public void installSuggestions(List<WifiNetworkSuggestion> suggestions) {
		// TODO ideally we want to remove old networks, especially Passpoint

		if (!(suggestions instanceof ArrayList)) {
			suggestions = new ArrayList<>(suggestions);
		}

		// TODO "null wants to add eduroam" - what is null?

		Bundle bundle = new Bundle();
		bundle.putParcelableArrayList(Settings.EXTRA_WIFI_NETWORK_LIST, (ArrayList<WifiNetworkSuggestion>) suggestions);
		Intent intent = new Intent(Settings.ACTION_WIFI_ADD_NETWORKS);
		intent.putExtras(bundle);
		context.startActivity(intent);

		// TODO how to get a result?
	}

	/**
	 * Remove networks with matching SSIDs
	 *
	 * @param ssids Remove network matching these SSIDs
	 */
	@Override
	public void removeNetwork(String... ssids) {
		// It's not possible to remove SSIDs that are created through intentions
		// But let's remove everything to be sure

		removeNetwork();
	}

	/**
	 * Checks if a network with the given SSID is configured
	 *
	 * @param ssid Check if a network with this SSID exists
	 * @return A network with the given SSID exists
	 */
	@Override
	public boolean isNetworkConfigured(String ssid) {
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
		return false;
	}
}
