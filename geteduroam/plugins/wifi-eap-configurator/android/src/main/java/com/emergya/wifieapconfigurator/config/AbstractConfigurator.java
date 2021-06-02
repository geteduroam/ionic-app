package com.emergya.wifieapconfigurator.config;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.LocationManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import androidx.annotation.RequiresPermission;
import androidx.preference.PreferenceManager;

import com.emergya.wifieapconfigurator.notification.StartNotifications;
import com.emergya.wifieapconfigurator.notification.StartRemoveNetwork;

/**
 * The configurator is used to install a {@code WifiProfile} in the device
 *
 * Due to Android changing their Wi-Fi API considerably from Android 9 through 11 (API 28-30),
 * this class is abstract and has API-specific subclasses.  The old API calls (from API 28) are
 * arguably the most user-friendly, in that they do what the user would most expect.  After running
 * the app, the Wi-Fi network is configured, after running the app again, the network is updated,
 * and after deleting the app, the Wi-Fi network is deleted.  This is done with the
 * {@code WifiManager.addNetwork} API.
 *
 * Sadly, this API is only limited available from API 29 (available for Passpoint, not for SSID),
 * and completely unavailable from API 30 and onwards.  The replacement is the Suggestions API,
 * which provide the user with a dialog asking them if they want to accept the network from our app.
 * On Android 10, this does not always work the way one would expect; notifications are often not
 * visible to the user and it gives the impression things are just not working.  On Android 11
 * it works better, with the notifications showing up at the time they're being configured.
 */
public abstract class AbstractConfigurator {
	protected final Context context;
	protected final WifiManager wifiManager;

	AbstractConfigurator(Context context) {
		this.context = context;
		wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
	}

	public static void setExpireNetwork(Context context) {
		Intent intent = new Intent();
		intent.putExtra("expiration", true);
		StartRemoveNetwork.enqueueWorkStart(context, intent);
	}

	/**
	 * Remove networks with matching SSIDs
	 *
	 * @param ssids Remove network matching these SSIDs
	 */
	public abstract void removeNetwork(String... ssids);

	/**
	 * Enable wifi of the device
	 *
	 * @throws NetworkInterfaceException Wi-Fi could not be enabled
	 */
	public final void enableWifi() throws NetworkInterfaceException {
		if (!wifiManager.setWifiEnabled(true)) {
			throw new NetworkInterfaceException("Unable to enable Wi-Fi on the device");
			//throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.wifi.disabled");
		}
	}

	/**
	 * Check if the SSID is in range
	 *
	 * @param ssid SSID to check
	 * @return SSID is in range
	 */
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public final boolean reachableSSID(String ssid) {
		if (ssid == null || "".equals(ssid)) {
			throw new IllegalArgumentException("No SSID provided");
			//throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ssid.missing");
		}

		// TODO is this check really necessary? Can't we just check the actual permission?
		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) {
			throw new IllegalStateException("Location services is disabled");
			//throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.location.disabled");
		}

		for (ScanResult s : wifiManager.getScanResults()) {
			if (s.SSID.equals(ssid) || s.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if the device is currently connected to the given SSID
	 *
	 * @param ssid SSID to check
	 * @return
	 */
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public final boolean isConnectedSSID(String ssid) {
		if (ssid == null || "".equals(ssid)) {
			throw new IllegalArgumentException("No SSID provided");
		}

		// TODO is this check really necessary? Can't we just check the actual permission?
		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) {
			throw new IllegalStateException("Location services is disabled");
		}

		WifiInfo info = wifiManager.getConnectionInfo();
		String connectedSSID = info.getSSID();

		// WifiInfo#getSSID() documentation states that the SSID is surrounded by quotes,
		// iff it can be decoded as UTF8
		return ("\"" + ssid + "\"").equals(connectedSSID);
	}

	/**
	 * Determines if any of the specified SSIDs are configured on this device
	 *
	 * @param ssids SSIDs to check
	 * @return At least one of the SSIDs is configured
	 */
	public final boolean areAnyNetworksConfigured(String... ssids) {
		for (String ssid : ssids) {
			if (isNetworkConfigured(ssid)) return true;
		}

		return false;
	}

	/**
	 * Checks if a network with the given SSID is configured
	 *
	 * @param ssid Check if a network with this SSID exists
	 * @return A network with the given SSID exists
	 */
	public abstract boolean isNetworkConfigured(String ssid);

	/**
	 * Checks if the network with the given SSID can be overridden
	 *
	 * @param ssid Check if a network with this SSID can be overridden
	 * @return The network with the given SSID can be overridden
	 */
	public abstract boolean isNetworkOverrideable(String ssid);

	/**
	 * Check if the Wi-Fi is enabled on the device
	 *
	 * @return Wi-Fi is enabled
	 */
	public boolean checkEnabledWifi() {
		return wifiManager.isWifiEnabled();
	}

	/**
	 * Write the institution ID to the application store
	 *
	 * @param institutionID Institution ID to store
	 */
	public void writeToSharedPref(String institutionID) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		SharedPreferences.Editor editor = sharedPref.edit();
		editor.putString("institutionId", institutionID);
		editor.apply();
	}

	/**
	 * Send a notification at the specified date
	 *
	 * TODO what's the date format?
	 *
	 * @param date
	 * @param title
	 * @param message
	 */
	public void sendNotification(String date, String title, String message) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		SharedPreferences.Editor editor = sharedPref.edit();
		editor.putString("date", date);
		editor.putString("title", title);
		editor.putString("message", message);
		editor.apply();
		StartNotifications.enqueueWorkStart(context, new Intent());
		setExpireNetwork(context);
	}

	/**
	 * Reads the institutionId saved in the SharedPref of the app
	 *
	 * @return Stored institution ID
	 */
	public String readFromSharedPref() {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		return sharedPref.getString("institutionId", "");
	}
}
