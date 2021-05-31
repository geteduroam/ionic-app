package com.emergya.wifieapconfigurator.config;

import android.Manifest;
import android.annotation.TargetApi;
import android.content.Context;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.annotation.RequiresPermission;

import com.emergya.wifieapconfigurator.WifiEapConfiguratorException;

import java.util.List;

/**
 * NetworkManagerP is the responsable of implement the abstract methods of NetworkManager. This class
 * implements the methods to work in all devices with API less and equal than API 28.
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
	 * @param ssid             Configure a network with this SSID
	 * @param enterpriseConfig Authentication configuration
	 * @return ID of the network description created
	 */
	public int configureSSID(String ssid, WifiEnterpriseConfig enterpriseConfig) throws WifiEapConfiguratorException {
		assert (ssid != null && !"".equals(ssid));

		WifiConfiguration config = new WifiConfiguration();
		config.SSID = "\"" + ssid + "\"";
		config.priority = 1;
		config.status = WifiConfiguration.Status.ENABLED;
		config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
		config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
		config.enterpriseConfig = enterpriseConfig;

		int networkId;
		try {
			networkId = wifiManager.addNetwork(config);
		} catch (java.lang.SecurityException e) {
			Log.e("error", e.getMessage());
			e.printStackTrace();
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.security", e);
		}
		if (networkId == -1) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.alreadyAssociated");
		}

		wifiManager.disconnect();
		wifiManager.enableNetwork(networkId, true);
		wifiManager.reconnect();

		wifiManager.setWifiEnabled(true);

		return networkId;
	}

	/**
	 * Remove the network of the SSID sended
	 *
	 * @param ssids SSIDs of the networks to be removed
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
	public void configurePasspoint(PasspointConfiguration config) throws WifiEapConfiguratorException {
		try {
			try {
				// Remove any existing networks with the same FQDN
				wifiManager.removePasspointConfiguration(config.getHomeSp().getFqdn());
			} catch (IllegalArgumentException e) { /* do nothing */ }
			wifiManager.addOrUpdatePasspointConfiguration(config);
		} catch (IllegalArgumentException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passpoint.linked", e);
		} catch (Exception e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passpoint.not.enabled", e);
		}
	}

}
