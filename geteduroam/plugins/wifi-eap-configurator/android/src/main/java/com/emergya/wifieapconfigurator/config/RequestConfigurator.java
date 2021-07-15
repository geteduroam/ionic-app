package com.emergya.wifieapconfigurator.config;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkRequest;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

/**
 * A configurator using Network Requests
 *
 * Network Requests trigger a prompt for the user to connect to a "temporary network"
 *
 * This is not useful for configuring eduroam for long-term use,
 * but it might be useful for connecting to an onboarding network.
 *
 * Because of this, currently this class is unused, but it's kept for possible further use.
 */
@RequiresApi(api = Build.VERSION_CODES.R)
public class RequestConfigurator extends AbstractConfigurator {

	final ConnectivityManager cm = (ConnectivityManager)
		context.getApplicationContext()
			.getSystemService(Context.CONNECTIVITY_SERVICE);

	RequestConfigurator(Context context) {
		super(context);
	}

	public void installNetworkRequests(NetworkRequest... networkRequests) {
		for (NetworkRequest networkRequest : networkRequests) {
			cm.requestNetwork(networkRequest, new ConnectivityManager.NetworkCallback() {
				@Override
				public void onAvailable(@NonNull Network network) {
					super.onAvailable(network);
					cm.bindProcessToNetwork(network);
				}
			});
		}
	}

	/**
	 * Remove networks with matching SSIDs
	 *
	 * @param ssids Remove network matching these SSIDs
	 */
	@Override
	public void removeNetwork(String... ssids) {
		// Unable to remove those?
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
