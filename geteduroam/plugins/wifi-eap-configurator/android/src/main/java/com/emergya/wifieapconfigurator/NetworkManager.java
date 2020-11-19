package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.ScanResult;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.net.wifi.hotspot2.pps.HomeSp;
import android.net.wifi.hotspot2.pps.Credential;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;

import androidx.preference.PreferenceManager;
import android.util.Base64;
import android.util.Log;


import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.ArrayList;

import static androidx.core.content.PermissionChecker.checkSelfPermission;


/**
 * NetworkManager is the abstract class responsable of implement the common methods of network configuration.
 * This class have the neccessary methods to create a configuration and configure it in the device.
 */
@NativePlugin(
		permissions = {
				Manifest.permission.ACCESS_WIFI_STATE,
				Manifest.permission.CHANGE_WIFI_STATE,
				Manifest.permission.ACCESS_FINE_LOCATION
		})
public abstract class NetworkManager {

	private WifiManager wifiManager;
	protected ProfileDetails profileDetails;

	/**
	 * Initialize the attribute profileDetails that contain all parameter sended from ionic
	 * @param profile
	 */
	public NetworkManager(ProfileDetails profile) {
		this.profileDetails = profile;
	}

	/**
	 * Check if the basic configuration exist to configure a network, and return it
	 * @param call
	 * @param context
	 * @return
	 * @throws JSONException
	 */
	public List configureAP(PluginCall call, Context context) throws JSONException {
		boolean res = true;

		if((this.profileDetails.getSsids().length == 0 || this.profileDetails.getSsids()[0] == "") && this.profileDetails.getOids().length == 0) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
			res = false;
		}

		if (this.profileDetails.getEap() == null) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.eap.invalid");
			call.success(object);
			res = false;
		}

		if (this.profileDetails.getClientCertificate() == null && this.profileDetails.getPassPhrase() == null) {
			if (this.profileDetails.getUsername() == null || this.profileDetails.getUsername().equals("")) {
				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.username.missing");
				call.success(object);
				res = false;
			}

			if (this.profileDetails.getPassword() == null || this.profileDetails.getPassword().equals("")) {
				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.password.missing");
				call.success(object);
				res = false;
			}

			if (this.profileDetails.getAuth() == null) {
				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.auth.invalid");
				call.success(object);
				res = false;
			}
		}

		for(String ssid : this.profileDetails.getSsids()) {
			try {
				removeNetwork(ssid, context);
			} catch (Throwable _) {
				/* ignore exceptions when removing the network,
				 * since many Android versions don't let us remove them,
				 * but allow us to override them
				 */
			}
		}

		if (res) {
			for (int i = 0 ; i < this.profileDetails.getSsids().length ; i++) {
				res = getNetworkAssociated(context, call, this.profileDetails.getSsids()[i]);
			}
		}

		List parameters = new ArrayList();

		if (res) {
			parameters = connectAP(call);
			parameters.add(this.profileDetails.getSsids());
			parameters.add(this.profileDetails.getOids());
			return parameters;
		}
		return null;
	}

	/**
	 * Return the configuration of SSID and the configuration of the passpoint to configure it
	 * @param call
	 * @return
	 */
	public List connectAP(PluginCall call) {

		WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

		enterpriseConfig.setAnonymousIdentity(this.profileDetails.getAnonymousIdentity());

		if (this.profileDetails.getServernames().length != 0) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
				enterpriseConfig.setDomainSuffixMatch(getLongestSuffix(this.profileDetails.getServernames()));
				enterpriseConfig.setAltSubjectMatch("DNS:" + String.join(";DNS:", this.profileDetails.getServernames()));
			}
		} else {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ca.missing");
			call.success(object);
		}

		enterpriseConfig.setEapMethod(this.profileDetails.getEap());

		CertificateFactory certFactory = null;
		X509Certificate[] caCerts = null;
		List<X509Certificate> certificates = new ArrayList<X509Certificate>();
		// building the certificates
		for (String certString : this.profileDetails.getCaCertificates()) {
			byte[] bytes = Base64.decode(certString, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);

			try {
				certFactory = CertificateFactory.getInstance("X.509");
				X509Certificate certificate = (X509Certificate) certFactory.generateCertificate(b);
				boolean[] usage = certificate.getKeyUsage();
				// https://docs.oracle.com/javase/7/docs/api/java/security/cert/X509Certificate.html#getKeyUsage()
				// 5 is KeyUsage keyCertSign, which indicates the certificate is a CA
				if (usage[5]) certificates.add(certificate);
				// We really shouldn't expect any certificate here to NOT be a CA,
				// CAT shows a nice red warning when you try to configure this,
				// but experience shows that sometimes this is not enough of a deterrent.
				// We may very well block profiles like this, but then it should be done BEFORE
				// the user enters their username/password, not after.
			} catch (CertificateException e) {
				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
				call.success(object);
			} catch (IllegalArgumentException e) {
				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
				call.success(object);
			}
		}
		try {
			enterpriseConfig.setCaCertificates(certificates.toArray(new X509Certificate[certificates.size()]));
		} catch (IllegalArgumentException e) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
			call.success(object);
		}

		X509Certificate cert = null;
		PrivateKey key = null;

		// Explicitly reset client certificate, will set later if needed
		enterpriseConfig.setClientKeyEntry(null, null);

		if (this.profileDetails.getEap() != WifiEnterpriseConfig.Eap.TLS) {
			enterpriseConfig.setIdentity(this.profileDetails.getUsername());
			enterpriseConfig.setPassword(this.profileDetails.getPassword());

			enterpriseConfig.setPhase2Method(this.profileDetails.getAuth());

		} else {
			// Explicitly unset unused fields
			enterpriseConfig.setPassword("");
			enterpriseConfig.setPhase2Method(WifiEnterpriseConfig.Phase2.NONE);

			// For TLS, "identity" is used for outer identity,
			// while for PEAP/TTLS, "identity" is the inner identity,
			// and anonymousIdentity is the outer identity
			// - so we have to do some weird shuffling here.
			enterpriseConfig.setIdentity(this.profileDetails.getAnonymousIdentity());

			KeyStore pkcs12ks = null;
			try {
				pkcs12ks = KeyStore.getInstance("pkcs12");

				byte[] bytes = Base64.decode(this.profileDetails.getClientCertificate(), Base64.NO_WRAP);
				ByteArrayInputStream b = new ByteArrayInputStream(bytes);
				InputStream in = new BufferedInputStream(b);
				try {
					pkcs12ks.load(in, this.profileDetails.getPassPhrase().toCharArray());
				} catch(Exception e) {
					JSObject object = new JSObject();
					object.put("success", false);
					object.put("message", "plugin.wifieapconfigurator.error.passphrase.null");
					call.success(object);
				}

				Enumeration<String> aliases = pkcs12ks.aliases();

				while (aliases.hasMoreElements()) {
					String alias = aliases.nextElement();
					cert = (X509Certificate) pkcs12ks.getCertificate(alias);
					key = (PrivateKey) pkcs12ks.getKey(alias, this.profileDetails.getPassPhrase().toCharArray());
					enterpriseConfig.setClientKeyEntry(key, cert);
				}

			} catch (KeyStoreException e) {
				sendClientCertificateError(e, call);
				e.printStackTrace();
			} catch (NoSuchAlgorithmException e) {
				sendClientCertificateError(e, call);
				e.printStackTrace();
			} catch (UnrecoverableKeyException e) {
				sendClientCertificateError(e, call);
				e.printStackTrace();
			}
		}

		PasspointConfiguration config = this.createPasspointConfig(enterpriseConfig, key);

		List configs = new ArrayList();
		configs.add(enterpriseConfig);
		configs.add(config);
		return configs;
	}

	/**
	 * Return if the passphrase received through the plugin is correct
	 * @param call
	 * @throws KeyStoreException
	 * @throws CertificateException
	 * @throws NoSuchAlgorithmException
	 * @throws IOException
	 */
	public void validatePassPhrase(PluginCall call) throws KeyStoreException, CertificateException, NoSuchAlgorithmException, IOException {

		if (this.profileDetails.getClientCertificate() == null || this.profileDetails.getPassPhrase() == null) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.passphrase.validation");
			call.success(object);
			return;
		}

		KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

		byte[] bytes = Base64.decode(this.profileDetails.getClientCertificate(), Base64.NO_WRAP);
		ByteArrayInputStream b = new ByteArrayInputStream(bytes);
		InputStream in = new BufferedInputStream(b);

		try {
			pkcs12ks.load(in, this.profileDetails.getPassPhrase().toCharArray());
			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.passphrase.validation");
			call.success(object);
		} catch(Exception e) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.passphrase.validation");
			call.success(object);
		}

	}

	/**
	 * Create the configuration necessary to configure a passpoint and returns it
	 * @param enterpriseConfig
	 * @param key
	 * @return
	 */
	private PasspointConfiguration createPasspointConfig(WifiEnterpriseConfig enterpriseConfig, PrivateKey key) {
		PasspointConfiguration config = new PasspointConfiguration();

		HomeSp homeSp = new HomeSp();
		homeSp.setFqdn(enterpriseConfig.getDomainSuffixMatch());

		if (this.profileDetails.getDisplayName() != null) {
			homeSp.setFriendlyName(this.profileDetails.getDisplayName());
		} else {
			homeSp.setFriendlyName(this.profileDetails.getId() + " via Passpoint");
		}

		long[] roamingConsortiumOIDs = new long[this.profileDetails.getOids().length];
		int index = 0;
		for (String roamingConsortiumOIDString : profileDetails.getOids()) {
			if (!roamingConsortiumOIDString.startsWith("0x")) {
				roamingConsortiumOIDString = "0x" + roamingConsortiumOIDString;
			}
			roamingConsortiumOIDs[index] = Long.decode(roamingConsortiumOIDString);
			index++;
		}
		homeSp.setRoamingConsortiumOis(roamingConsortiumOIDs);

		config.setHomeSp(homeSp);
		Credential cred = new Credential();
		cred.setRealm(this.profileDetails.getId());
		cred.setCaCertificate(enterpriseConfig.getCaCertificate());

		switch(enterpriseConfig.getEapMethod()) {
			case WifiEnterpriseConfig.Eap.TLS:
				Credential.CertificateCredential certCred = new Credential.CertificateCredential();
				certCred.setCertType("x509v3");
				cred.setClientPrivateKey(key);
				cred.setClientCertificateChain(enterpriseConfig.getClientCertificateChain());
				certCred.setCertSha256Fingerprint(getFingerprint(enterpriseConfig.getClientCertificateChain()[0]));
				cred.setCertCredential(certCred);
				break;
			case WifiEnterpriseConfig.Eap.PEAP:
			case WifiEnterpriseConfig.Eap.TTLS:
			case WifiEnterpriseConfig.Eap.PWD:
				byte[] data = new byte[0];
				try {
					data = enterpriseConfig.getPassword().getBytes("UTF-8");
				} catch (UnsupportedEncodingException e) {
					e.printStackTrace();
				}
				String base64 = Base64.encodeToString(data, Base64.DEFAULT);

				Credential.UserCredential us = new Credential.UserCredential();
				us.setUsername(enterpriseConfig.getIdentity());
				us.setPassword(base64);
				us.setEapType(21);
				switch(enterpriseConfig.getPhase2Method()) {
					// Strings from android.net.wifi.hotspot2.pps.Credential.UserCredential.AUTH_METHOD_*
					case WifiEnterpriseConfig.Phase2.MSCHAPV2: us.setNonEapInnerMethod("MS-CHAP-V2"); break;
					case WifiEnterpriseConfig.Phase2.PAP: us.setNonEapInnerMethod("PAP"); break;
					case WifiEnterpriseConfig.Phase2.MSCHAP: us.setNonEapInnerMethod("MS-CHAP"); break;
					// Do we need a default case here?
				}
				cred.setUserCredential(us);
				break;
			default:
		}

		config.setCredential(cred);

		return config;
	}

	/**
	 * Abstract method that configure the network depending of the device API version
	 * @param context
	 * @param enterpriseConfig
	 * @param call
	 * @param config
	 * @param activity
	 * @param ssid
	 * @return
	 */
	@RequiresApi(api = Build.VERSION_CODES.Q)
	public abstract List connectNetwork(Context context, WifiEnterpriseConfig enterpriseConfig, PluginCall call, PasspointConfiguration config, Activity activity, String ssid);

	/**
	 * Send error when the client certificate is invalid
	 * @param e
	 * @param call
	 */
	private void sendClientCertificateError(Exception e, PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false);
		object.put("message", "plugin.wifieapconfigurator.error.clientCertificate.invalid - " + e.getMessage());
		call.success(object);
		Log.e("error", e.getMessage());
	}

	/**
	 * Call to the remove network if the ssid sended through the plugin is correct, otherwise returns an error
	 * @param context
	 * @param call
	 */
	public void removeNetwork(Context context, PluginCall call) {
		JSObject object = new JSObject();

		if (null == this.profileDetails.getSsid() || "".equals(this.profileDetails.getSsid())) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
		} else if (removeNetwork(this.profileDetails.getSsid(), context)) {
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.removed");
			call.success(object);
		} else {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.success.network.missing");
			call.success(object);
		}
	}

	/**
	 * Remove the network of the SSID sended
	 * @param ssid
	 * @param context
	 * @return
	 */
	public boolean removeNetwork(String ssid, Context context) {
		boolean res = false;
		WifiManager wifi = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);

		/*if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) { */
		List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
		for (WifiConfiguration conf : configuredNetworks) {
			if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				wifi.removeNetwork(conf.networkId);
				wifi.saveConfiguration();
				res = true;
			}
		}
		/*} else {
			wifi.removeNetworkSuggestions(new ArrayList<WifiNetworkSuggestion>());
			res = true;
		}*/

		return res;
	}

	/**
	 * Returns an WifiManager
	 * @param context
	 * @return
	 */
	WifiManager getWifiManager(Context context) {
		if (wifiManager == null) {
			wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
		}
		return wifiManager;
	}

	/**
	 * Enable wifi of the device
	 * @param context
	 * @param call
	 */
	public void enableWifi(Context context, PluginCall call) {
		//if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
		WifiManager wifiManager = getWifiManager(context);
		if (wifiManager.setWifiEnabled(true)) {
			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.wifi.enabled");
			call.success(object);
		} else {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
			call.success(object);
		}
		/*} else{
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
			call.success(object);
		}*/
	}

	/**
	 * Check if the SSID sended from ionic is configured in the device
	 * @param context
	 * @param call
	 * @return
	 */
	public boolean isNetworkAssociated(Context context, PluginCall call) {
		String ssid = null;
		boolean res = false, isOverridable = false;

		//if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
		if (this.profileDetails.getSsid() == null || this.profileDetails.getSsid().equals("")) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
			return res;
		}

		WifiManager wifi = getWifiManager(context);

		List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
		for (WifiConfiguration conf : configuredNetworks) {
			if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes

				String packageName = context.getPackageName();
				if (conf.toString().toLowerCase().contains(packageName.toLowerCase())) { // TODO document why case insensitive
					isOverridable = true;
				}

				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.network.alreadyAssociated");
				object.put("overridable", isOverridable);
				call.success(object);
				res = true;
				break;
			}
		}

		if (!res) {
			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.missing");
			call.success(object);
		}
		/*} else{
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
		}*/

		return res;
	}

	/**
	 * Check if the SSID sended from ionic is reachable or not
	 * @param context
	 * @param activity
	 * @param call
	 */
	public void reachableSSID(Context context, Activity activity, PluginCall call) {
		boolean isReachable = false;
		if (this.profileDetails.getSsid() == null || this.profileDetails.getSsid().equals("")) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
		}

		boolean granted = getPermission(Manifest.permission.ACCESS_FINE_LOCATION, context, activity);

		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.location.disabled");
			call.success(object);
		} else if (granted) {

			WifiManager wifiManager = getWifiManager(context);
			Iterator<ScanResult> results = wifiManager.getScanResults().iterator();

			while (isReachable == false && results.hasNext()) {
				ScanResult s = results.next();
				if (s.SSID.equals(this.profileDetails.getSsid()) || s.SSID.equals("\"" + this.profileDetails.getSsid() + "\"")) { // TODO document why ssid can be surrounded by quotes
					isReachable = true;
				}
			}

			String message = isReachable ? "plugin.wifieapconfigurator.success.network.reachable" : "plugin.wifieapconfigurator.error.network.notReachable";

			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", message);
			object.put("isReachable", isReachable);
			call.success(object);
		} else {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
			call.success(object);
		}
	}

	/**
	 * Check if the current network connected belong to the SSID sended from ionic
	 * @param context
	 * @param activity
	 * @param call
	 */
	public void isConnectedSSID(Context context, Activity activity, PluginCall call) {
		boolean isConnected = false;
		if (this.profileDetails.getSsid() == null || this.profileDetails.getSsid().equals("")) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
			call.success(object);
		}

		boolean granted = getPermission(Manifest.permission.ACCESS_FINE_LOCATION, context, activity);

		LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (!location) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.location.disabled");
			call.success(object);
		} else if (granted) {
			WifiManager wifiManager = getWifiManager(context);
			WifiInfo info = wifiManager.getConnectionInfo();
			String currentlySsid = info.getSSID();
			if (currentlySsid != null && (currentlySsid.equals("\"" + this.profileDetails.getSsid() + "\"") || currentlySsid.equals(this.profileDetails.getSsid()))) { // TODO document why ssid can be surrounded by quotes
				isConnected = true;
			}

			String message = isConnected ? "plugin.wifieapconfigurator.success.network.connected" : "plugin.wifieapconfigurator.error.network.notConnected";

			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", message);
			object.put("isConnected", isConnected);
			call.success(object);
		} else {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
			call.success(object);
		}

	}

	/**
	 * Returns if the network with the SSID sended its configured in the device
	 * @param context
	 * @param call
	 * @param ssid
	 * @return
	 */
	private boolean getNetworkAssociated(Context context, PluginCall call, String ssid) {
		boolean res = true, isOverridable = false;

		//if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
		WifiManager wifi = getWifiManager(context);
		List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();

		for (WifiConfiguration conf : configuredNetworks) {
			if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
				String packageName = context.getPackageName();
				if (conf.toString().toLowerCase().contains(packageName.toLowerCase())) { // TODO document why case insensitive
					isOverridable = true;
				}

				JSObject object = new JSObject();
				object.put("success", false);
				object.put("message", "plugin.wifieapconfigurator.error.network.alreadyAssociated");
				object.put("overridable", isOverridable);
				call.success(object);
				res = false;
				break;
			}
		}
		//}
		return res;
	}

	/**
	 * Check if the WIfi is enabled in the device
	 * @param context
	 * @param call
	 * @return
	 */
	public boolean checkEnabledWifi(Context context, PluginCall call) {
		boolean res = true;
		WifiManager wifi = getWifiManager(context);

		if (!wifi.isWifiEnabled()) {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
			call.success(object);
			res = false;
		}
		return res;
	}

	/**
	 * Requests permission to the app
	 * @param permission
	 * @param context
	 * @param activity
	 * @return
	 */
	boolean getPermission(String permission, Context context, Activity activity) {
		boolean res = true;
		if (!(checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED)) {
			res = false;
			ActivityCompat.requestPermissions(activity, new String[]{permission}, 123);
		}

		return res;
	}

	/**
	 * Verify if the CaCertificate its valid for Android looking for in the AndroidCaStore
	 * @param caCert
	 * @throws GeneralSecurityException
	 * @throws IOException
	 */
	private void verifyCaCert(X509Certificate caCert)
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
	 * Returns fingerprint of the certificate
	 * @param certChain
	 * @return
	 */
	private byte[] getFingerprint(X509Certificate certChain) {

		MessageDigest digester = null;
		byte[] fingerprint = null;
		try {
			digester = MessageDigest.getInstance("SHA-256");
			digester.reset();
			fingerprint = digester.digest(certChain.getEncoded());
		} catch (NoSuchAlgorithmException | CertificateEncodingException e) {
			e.printStackTrace();
		}
		return fingerprint;
	}

	/**
	 *
	 * @param strings
	 * @return
	 */
	private static String getLongestSuffix(String[] strings) {
		if (strings.length == 0) return "";
		if (strings.length == 1) return strings[0];
		String longest = strings[0];
		for(String candidate : strings) {
			int pos = candidate.length();
			do {
				pos = candidate.lastIndexOf('.', pos - 2) + 1;
			} while (pos > 0 && longest.endsWith(candidate.substring(pos)));
			if (!longest.endsWith(candidate.substring(pos))) {
				pos = candidate.indexOf('.', pos);
			}
			if (pos == -1) {
				longest = "";
			} else if (longest.endsWith(candidate.substring(pos))) {
				longest = candidate.substring(pos == 0 ? 0 : pos + 1);
			}
		}
		return longest;
	}

	/**
	 * Send a notification with the attributes sended from ionic
	 * @param context
	 * @param call
	 * @throws JSONException
	 */
	public void sendNotification(Context context, PluginCall call) throws JSONException {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		SharedPreferences.Editor editor = sharedPref.edit();
		editor.putString("date", this.profileDetails.getStringDate());
		editor.putString("title", this.profileDetails.getTitle());
		editor.putString("message", this.profileDetails.getMessage());
		editor.apply();
		StartNotifications.enqueueWorkStart(context, new Intent());
	}

	/**
	 * Writes the datas sended from ionic to the SharedPref of the app
	 * @param context
	 * @param call
	 */
	public void writeToSharedPref(Context context, PluginCall call) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		SharedPreferences.Editor editor = sharedPref.edit();
		editor.putString("institutionId", this.profileDetails.getInstitutionId());
		editor.apply();
		JSObject object = new JSObject();
		object.put("success", true);
		object.put("message", "plugin.wifieapconfigurator.success.writing");
		call.success(object);
	}

	/**
	 * Reads the institutionId saved in the SharedPref of the app
	 * @param context
	 * @param call
	 */
	public void readFromSharedPref(Context context, PluginCall call) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
		String ret = sharedPref.getString("institutionId", "");
		if (ret != "") {
			JSObject object = new JSObject();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.reading");
			object.put("id", ret);
			call.success(object);
		} else {
			JSObject object = new JSObject();
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.reading");
			call.success(object);
		}
	}

	/**
	 * Returns if the app is opened through a notification
	 * @param activity
	 * @param call
	 */
	public void checkIfOpenThroughNotifications(Activity activity, PluginCall call) {
		Boolean openFromNot;
		if (activity.getComponentName().getClassName().contains("MainActivity")) {
			openFromNot = false;
		} else {
			openFromNot = true;
		}
		JSObject object = new JSObject();
		object.put("fromNotification", openFromNot);
		call.success(object);
	}
}
