package com.emergya.wifieapconfigurator;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkRequest;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import java.util.ArrayList;

@RequiresApi(api = Build.VERSION_CODES.R)
public class NetworkProfileManagerIntents extends NetworkProfileManagerSuggestions {
	NetworkProfileManagerIntents(Context context) {
		super(context);
	}

	public void installSuggestions(ArrayList<WifiNetworkSuggestion> suggestions, Activity activity) {
		Intent intent = new Intent(Settings.ACTION_WIFI_ADD_NETWORKS);
		intent.putParcelableArrayListExtra(Settings.EXTRA_WIFI_NETWORK_LIST, suggestions);
		activity.startActivityForResult(intent, 1000);

		final Activity myActivity = new Activity() {
			@Override
			protected void onActivityResult(int requestCode, int resultCode, Intent data) {
				super.onActivityResult(requestCode, resultCode, data);

				// check if the request code is same as what is passed  here it is 1
				if (requestCode == 1000) {
					// Make sure the request was successful
					if (resultCode == RESULT_OK) {
						System.out.println("The user agree the configuration");
					}
				}
			}
		};
	}

	public void installNetworkRequests(NetworkRequest... networkRequests) {
		for (NetworkRequest networkRequest : networkRequests) {
			final ConnectivityManager cm = (ConnectivityManager)
				context.getApplicationContext()
					.getSystemService(Context.CONNECTIVITY_SERVICE);
			if (cm != null) {
				cm.requestNetwork(networkRequest, new ConnectivityManager.NetworkCallback() {
					@Override
					public void onAvailable(@NonNull Network network) {
						super.onAvailable(network);
						cm.bindProcessToNetwork(network);
					}
				});
			}
		}
	}

	/**
	 * Remove the network of the SSID sended
	 *
	 * @param ssids
	 * @return
	 */
	@Override
	public void removeNetwork(String... ssids) {

	}

	/**
	 * Returns if the network with the SSID sended its configured in the device
	 *
	 * @param ssid
	 * @return
	 */
	@Override
	public boolean isNetworkConfigured(String ssid) {
		return false;
	}

	/**
	 * Returns if the network with the SSID can be overridden
	 *
	 * @param ssid
	 * @return
	 */
	@Override
	public boolean isNetworkOverrideable(String ssid) {
		return false;
	}
}
