package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.LocationManager;
import android.net.wifi.ScanResult;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.net.wifi.hotspot2.pps.HomeSp;
import android.net.wifi.hotspot2.pps.Credential;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Base64;

import androidx.annotation.RequiresPermission;
import androidx.preference.PreferenceManager;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.Certificate;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.X509Certificate;
import java.util.AbstractMap;
import java.util.Arrays;
import java.util.Collection;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

/**
 * NetworkManager is the abstract class responsable of implement the common methods of network configuration.
 * This class have the neccessary methods to create a configuration and configure it in the device.
 */
public abstract class NetworkProfileManager {
	protected NetworkProfileManager(Context context) {
		this.context = context;
		wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
	}

	protected final Context context;
	protected final WifiManager wifiManager;

	/**
	 * Remove the network of the SSID sended
	 * @param ssids
	 * @return
	 */
	public abstract void removeNetwork(String... ssids);

	/**
	 * Enable wifi of the device
	 * @throws WifiEapConfiguratorException Wi-Fi could not be enabled
	 */
	public final void enableWifi() throws WifiEapConfiguratorException {
		if (!wifiManager.setWifiEnabled(true)) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.wifi.disabled");
		}
	}

	/**
	 * Check if the SSID sended from ionic is reachable or not
	 * @param ssid
	 * @return
	 */
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public final boolean reachableSSID(String ssid) throws WifiEapConfiguratorException {
		if (ssid == null || "".equals(ssid)) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ssid.missing");
		}

		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.location.disabled");

		Iterator<ScanResult> results = wifiManager.getScanResults().iterator();

		while (results.hasNext()) {
			ScanResult s = results.next();
			if (s.SSID.equals(ssid) || s.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if the current network connected belong to the SSID sended from ionic
	 * @param ssid
	 * @param activity
	 * @return
	 */
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public final boolean isConnectedSSID(String ssid, Activity activity) throws WifiEapConfiguratorException {
		if (ssid == null || "".equals(ssid)) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ssid.missing");
		}

		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.location.disabled");

		WifiInfo info = wifiManager.getConnectionInfo();
		String currentlySsid = info.getSSID();
		return ssid.equals(currentlySsid) || ("\"" + ssid + "\"").equals(currentlySsid); // TODO document why ssid can be surrounded by quotes
	}

	public final boolean areAnyNetworksConfigured(String... ssids) {
		for(String ssid : ssids) {
			if (isNetworkConfigured(ssid)) return true;
		}

		return false;
	}

	/**
	 * Returns if a network with the given SSID is configured
	 *
	 * @param ssid Check if a network with this SSID exists
	 * @return A network with the given SSID exists
	 */
	public abstract boolean isNetworkConfigured(String ssid);

	/**
	 * Returns if the network with the given SSID can be overridden
	 *
	 * @param ssid Check if a network with this SSID can be overridden
	 * @return The network with the given SSID can be overridden
	 */
	public abstract boolean isNetworkOverrideable(String ssid);

	/**
	 * Check if the Wi-Fi is enabled on the device
	 * @return Wi-Fi is enabled
	 */
	public boolean checkEnabledWifi() {
		return wifiManager.isWifiEnabled();
	}

	/**
	 * Verify if the CaCertificate its valid for Android looking for in the AndroidCaStore
	 * @param caCert
	 * @throws GeneralSecurityException
	 * @throws IOException
	 */
	private static void verifyCaCert(X509Certificate caCert)
			throws GeneralSecurityException, IOException {
		CertificateFactory factory = CertificateFactory.getInstance("X.509");
		CertPathValidator validator =
				CertPathValidator.getInstance(CertPathValidator.getDefaultType());
		CertPath path = factory.generateCertPath(Arrays.asList(caCert));
		KeyStore ks = KeyStore.getInstance("AndroidCAStore");
		ks.load(null, null);
		PKIXParameters params = new PKIXParameters(ks);
		params.setRevocationEnabled(false);
		validator.validate(path, params);
	}

	/**
	 * Writes the datas sended from ionic to the SharedPref of the app
	 * @param institutionID Institution ID to store
	 */
	public void writeToSharedPref(String institutionID) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		SharedPreferences.Editor editor = sharedPref.edit();
		editor.putString("institutionId", institutionID);
		editor.apply();
	}

	/**
	 * Send a notification with the attributes sended from ionic
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
		this.setExpireNetwork(context);
	}

	/**
	 * Reads the institutionId saved in the SharedPref of the app
	 * @return Stored institituion ID
	 */
	public String readFromSharedPref() {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		return sharedPref.getString("institutionId", "");
	}
	
	public static void setExpireNetwork(Context context) {
		Intent intent = new Intent();
		intent.putExtra("expiration", true);
		StartRemoveNetwork.enqueueWorkStart(context, intent);
	}
}
