package com.emergya.wifieapconfigurator.config;

import android.Manifest;
import android.annotation.TargetApi;
import android.content.Context;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.annotation.RequiresPermission;

import java.util.List;

/**
 * The LegacyConfigurator can be used to configure Wi-Fi network profiles when the target API
 * version is 28 or lower.  It works on Android 11, but only with a low enough target API.
 */
@RequiresApi(api = Build.VERSION_CODES.O)
@TargetApi(Build.VERSION_CODES.P)
public class LegacyConfigurator extends AbstractConfigurator {

	public LegacyConfigurator(Context context) {
		super(context);
	}

	/**
	 * Configure a network profile for devices with API 28 or lower.
	 *
	 * @param config The Wi-Fi configuration
	 * @return ID of the network description created
	 */
	public int configureNetworkConfiguration(WifiConfiguration config) throws SecurityException, NetworkConfigurationException {
		// Can throw SecurityException
		int networkId = wifiManager.addNetwork(config);

		if (networkId == -1)
			throw new NetworkConfigurationException("Network " + config.SSID + " was not created. Did it already exist?");

		return networkId;
	}

	/**
	 * Connect to the network with the given ID, returned by configureNetworkConfiguration
	 *
	 * @param networkId The network ID to connect to
	 */
	public void connectNetwork(int networkId) {
		wifiManager.disconnect();
		wifiManager.enableNetwork(networkId, true);
		wifiManager.reconnect();

		wifiManager.setWifiEnabled(true);
	}

	/**
	 * Remove networks with matching SSIDs
	 *
	 * @param ssids Remove network matching these SSIDs
	 */
	@Override
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public void removeNetwork(String... ssids) {
		List<WifiConfiguration> configuredNetworks = wifiManager.getConfiguredNetworks();
		for (WifiConfiguration conf : configuredNetworks) {
			for (String ssid : ssids) {
				if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
					wifiManager.removeNetwork(conf.networkId);
					//wifiManager.saveConfiguration(); // not needed, removeNetwork already commits
					break;
				}
			}
		}
	}

	/**
	 * Checks if a network with the given SSID is configured
	 *
	 * @param ssid Check if a network with this SSID exists
	 * @return A network with the given SSID exists
	 */
	@Override
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public boolean isNetworkConfigured(String ssid) {
		List<WifiConfiguration> configuredNetworks = wifiManager.getConfiguredNetworks();

		for (WifiConfiguration conf : configuredNetworks) {
			if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if the network with the given SSID can be overridden
	 *
	 * @param ssid Check if a network with this SSID can be overridden
	 * @return The network with the given SSID can be overridden
	 */
	@Override
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public boolean isNetworkOverrideable(String ssid) {
		List<WifiConfiguration> configuredNetworks = wifiManager.getConfiguredNetworks();

		for (WifiConfiguration conf : configuredNetworks) {
			if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				String packageName = context.getPackageName();


				// Return whether the network was made by us
				return conf.toString().toLowerCase().contains(packageName.toLowerCase()); // TODO document why case insensitive
			}
		}

		// Doesn't exist, so override away
		return true;
	}

	/**
	 * Removes the passpoint configuration if exists in the device
	 *
	 * @param id FQDN of the Passpoint configuration
	 */
	protected void removePasspoint(String id) {
		for (PasspointConfiguration conf : wifiManager.getPasspointConfigurations()) {
			if (id.equals(conf.getHomeSp().getFqdn())) {
				try {
					wifiManager.removePasspointConfiguration(id);
				} catch (IllegalArgumentException e) {
					Log.d("Passpoint", "removePasspoint: " + e);
				}
			}
		}
	}

	/**
	 * Configures the passpoint in the device if this have available passpoint
	 *
	 * @param config Passpoint configuration
	 */
	public void configurePasspoint(PasspointConfiguration config) throws SecurityException, NetworkInterfaceException {
		try {
			try {
				// Remove any existing networks with the same FQDN
				wifiManager.removePasspointConfiguration(config.getHomeSp().getFqdn());
			} catch (IllegalArgumentException | SecurityException e) {
				// According to the documentation, IllegalArgumentException can be thrown
				// But after testing, we see that SecurityException will be thrown
				// with message "Permission denied".

				// This error makes sense when observed (maybe we can't remove the network),
				// but it's undocumented that this error can be thrown.
			}
			wifiManager.addOrUpdatePasspointConfiguration(config);
		} catch (IllegalArgumentException e) {
			// Can throw when configuration is wrong or device does not support Passpoint
			// I'm going to be cocky here, and assume that our code generating the configuration
			// doesn't contain a bug.  During testing, this was the case,
			// while we did encounter a few devices without Passpoint support.

			throw new NetworkInterfaceException("Device does not support passpoint", e);
		}
	}

}
