package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.content.SharedPreferences;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiNetworkSuggestion;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.annotation.RequiresPermission;
import androidx.core.app.ActivityCompat;
import androidx.core.content.PermissionChecker;
import androidx.preference.PreferenceManager;

import com.emergya.wifieapconfigurator.config.AbstractConfigurator;
import com.emergya.wifieapconfigurator.config.EapConfigCAException;
import com.emergya.wifieapconfigurator.config.EapConfigClientCertificateException;
import com.emergya.wifieapconfigurator.config.EapConfigValueException;
import com.emergya.wifieapconfigurator.config.LegacyConfigurator;
import com.emergya.wifieapconfigurator.config.NetworkConfigurationException;
import com.emergya.wifieapconfigurator.config.NetworkInterfaceException;
import com.emergya.wifieapconfigurator.config.NetworkSuggestionException;
import com.emergya.wifieapconfigurator.config.SuggestionConfigurator;
import com.emergya.wifieapconfigurator.config.WifiProfile;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static androidx.core.content.PermissionChecker.checkSelfPermission;

/**
 * Class for communicating between ionic and the Android Wi-Fi API
 *
 * This is the only class that can import from the package {@code com.getcapacitor},
 * and the only class allowed to handle objects from it.  It is responsible for parsing incoming
 * calls from ionic (although this parsing can be as simple as extracting a JSONObject from it) and
 * returning a result back.
 *
 * All methods marked with {code @PluginMethod} can be called from ionic.  Returned is a JSON object
 * that will always contain the boolean {code success} and string {code message}, where
 * {code message} is a lower-case string in the form {@code "plugin.wifieapconfigurator."},
 * followed by either {@code "success"} or {@code "error"}, followed by one or more keywords
 * indicating what the result applies to.
 */
@NativePlugin(
	permissions = {
		Manifest.permission.ACCESS_WIFI_STATE,
		Manifest.permission.CHANGE_WIFI_STATE,
		Manifest.permission.ACCESS_FINE_LOCATION
	})
@RequiresApi(api = Build.VERSION_CODES.O)
public class WifiEapConfigurator extends Plugin {

	/**
	 * Read the capacitor object and configure the Wi-Fi payloads inside
	 *
	 * @param call Capacitor object containing call made in ionic
	 */
	@RequiresPermission(anyOf = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CHANGE_NETWORK_STATE})
	@PluginMethod()
	public void configureAP(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false); // set to true if we succeed

		try {
			configureAP(call.getData());
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.linked");
		} catch (WifiEapConfiguratorException e) {
			Log.e(getClass().getSimpleName(), e.getMessage());
			object.put("message", e.getMessage());

			// TODO call.error() should be used if anything goes wrong
			// but the current JS code doesn't handle this well
			//Throwable cause = e.getCause();
			//call.error(e.getMessage(), cause instanceof Exception ? (Exception) cause : null);
		}

		call.success(object);
	}

	/**
	 * Configure networks using the given JSON data
	 * TODO: Implement in such a way that we don't need WifiEapConfiguratorException anymore
	 *
	 * @param profileData Wi-Fi configuration
	 * @throws WifiEapConfiguratorException When anything goes wrong; the exception message is given back to Capacitor
	 * @see WifiProfile#WifiProfile(JSONObject)
	 */
	@RequiresPermission(anyOf = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CHANGE_NETWORK_STATE})
	protected void configureAP(JSONObject profileData) throws WifiEapConfiguratorException {
		SharedPreferences.Editor editor = getPreferences().edit();
		int targetSDK = getContext().getApplicationContext().getApplicationInfo().targetSdkVersion;

		WifiProfile profile;
		try {
			// Parses certificate material and can throw
			profile = new WifiProfile(profileData);
		} catch (EapConfigValueException e) {
			Log.e(getClass().getSimpleName(), e.getMessage());
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.data.missing", e);
		} catch (EapConfigCAException e) {
			Log.e(getClass().getSimpleName(), e.getMessage());
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ca.invalid", e);
		} catch (EapConfigClientCertificateException e) {
			Log.e(getClass().getSimpleName(), e.getMessage());
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.clientcert.invalid", e);
		}

		// We prefer the legacy method, because it's more stable.
		// But Android blocks legacy SSID configurations from version Q,
		// and legacy Passpoint configurations from version R;
		// on and above these versions we have to use WifiNetworkSuggestions.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && targetSDK >= Build.VERSION_CODES.R) {
			if (!requestPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.permission.notGranted");
			}

			// Everything must be done with suggestions
			// TODO We use suggestions directly, should we use intents?
			SuggestionConfigurator suggestionConfigurator = new SuggestionConfigurator(getContext());

			List<WifiNetworkSuggestion> suggestions = profile.buildSSIDSuggestions();
			WifiNetworkSuggestion passpointSuggestion = profile.buildPasspointSuggestion();
			if (passpointSuggestion != null) suggestions.add(passpointSuggestion);
			installSuggestions(suggestionConfigurator, suggestions);
		} else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && targetSDK >= Build.VERSION_CODES.Q) {
			if (!requestPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.permission.notGranted");
			}

			// We have to do SSIDs with suggestions and Passpoint with legacy
			SuggestionConfigurator suggestionConfigurator = new SuggestionConfigurator(getContext());
			LegacyConfigurator legacyConfigurator = new LegacyConfigurator(getContext());

			List<WifiNetworkSuggestion> suggestions = profile.buildSSIDSuggestions();
			installSuggestions(suggestionConfigurator, suggestions);

			PasspointConfiguration passpointConfig = profile.buildPasspointConfig();
			if (passpointConfig != null) {
				configurePasspoint(legacyConfigurator, passpointConfig);
			}
		} else {
			// Everything below Q (below Android 10, below API version 29)
			// We get to use the legacy API for everything. YAY!

			LegacyConfigurator legacyConfigurator = new LegacyConfigurator(getContext());
			String[] ssids = profile.getSSIDs();

			PasspointConfiguration passpointConfig = profile.buildPasspointConfig();

			try {
				legacyConfigurator.removeNetwork(ssids);
			} catch (Throwable t) {
				/* ignore exceptions when removing the network,
				 * since many Android versions don't let us remove them,
				 * but allow us to override them
				 */
			}
			for (String ssid : ssids) {
				// We removed all SSIDs, but are they gone?
				// If not, are we at least allowed to override them?

				if (legacyConfigurator.isNetworkConfigured(ssid) && !legacyConfigurator.isNetworkOverrideable(ssid)) {
					throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.alreadyAssociated");
				}
			}

			int firstWifiId = -1;
			for (WifiConfiguration config : profile.buildWifiConfigurations()) {
				try {
					int wifiId = legacyConfigurator.configureNetworkConfiguration(config);

					// TODO There can be more than one SSID, but we can only store one
					// (we're in a loop, we will only consider the first)
					if (wifiId != -1 && firstWifiId == -1) {
						editor.putInt("netId", wifiId);
						legacyConfigurator.connectNetwork(wifiId);
						firstWifiId = wifiId;
					}
				} catch (SecurityException e) {
					throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.security", e);
				} catch (NetworkConfigurationException e) {
					// We removed networks earlier,
					// but this is the error that was logged in the old code,
					// and that worked fine, so we'll keep that for now.
					// In reality, we don't know the reason the network was refused.

					// TODO Figure out how can we actually get here?
					// NOTE There are other instances of "alreadyAssociated" being reported,
					// such as the loop before this one.

					throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.alreadyAssociated", e);
				}
			}
			// Now we're out of the SSID loop, store the changes we made in the loop
			editor.apply();

			if (passpointConfig != null)
				configurePasspoint(legacyConfigurator, passpointConfig);
		}

	}

	/**
	 * Validate the passphrase on a client certificate
	 *
	 * Call must contain these variables:
	 * {@code String certificate} Base64 encoded PKCS12 store
	 * {@code String passPhrase} Passphrase to test
	 *
	 * @see WifiProfile#validatePassPhrase(String, String)
	 */
	@PluginMethod
	public void validatePassPhrase(PluginCall call) {
		JSObject object = new JSObject();

		boolean success = WifiProfile.validatePassPhrase(call.getString("certificate"), call.getString("passPhrase"));

		object.put("success", success);
		if (success) {
			object.put("message", "plugin.wifieapconfigurator.success.passphrase.validation");
		} else {
			object.put("message", "plugin.wifieapconfigurator.error.passphrase.validation");
		}

		call.success(object);
	}

	/**
	 * Remove an SSID network
	 *
	 * Call must contain {@code String ssid}.
	 *
	 * @see AbstractConfigurator#removeNetwork(String...)
	 */
	@PluginMethod
	public void removeNetwork(PluginCall call) {
		JSObject object = new JSObject();
		String ssid = call.getString("ssid");
		if (ssid == null || "".equals(ssid)) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
		} else {
			getSSIDConfigurator().removeNetwork(call.getString("ssid"));
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.removed");
		}
		call.success(object);
	}

	/**
	 * Enable the Wi-Fi interface
	 *
	 * Call does not need to provide anything
	 *
	 * @see AbstractConfigurator#enableWifi()
	 */
	@PluginMethod
	public void enableWifi(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false);
		try {
			getSSIDConfigurator().enableWifi();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.wifi.enabled");
		} catch (NetworkInterfaceException e) {
			object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
		}

		call.success(object);
	}

	/**
	 * Check if an SSID network is associated
	 *
	 * Call must contain {@code String ssid}.
	 *
	 * TODO: It is unclear whether "associated" or "configured" is meant; clarify!
	 * Probably "configured" is meant, right?
	 *
	 * @see AbstractConfigurator#areAnyNetworksConfigured(String...)
	 */
	@PluginMethod
	public boolean isNetworkAssociated(PluginCall call) throws JSONException {
		Object[] ssids = call.getArray("ssid").toList().toArray();
		return getSSIDConfigurator().areAnyNetworksConfigured(Arrays.copyOf(ssids, ssids.length, String[].class));
	}

	/**
	 * Determines whether a certain SSID is reachable
	 *
	 * Call must contain {@code String ssid}.
	 *
	 * @see AbstractConfigurator#reachableSSID(String)
	 */
	@PluginMethod
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public void reachableSSID(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false);
		boolean granted = requestPermission(Manifest.permission.ACCESS_FINE_LOCATION);
		if (!granted) {
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
		} else {
			if (getSSIDConfigurator().reachableSSID(call.getString("ssid"))) {
				object.put("success", true);
				object.put("message", "plugin.wifieapconfigurator.success.network.reachable");
			} else {
				object.put("message", "plugin.wifieapconfigurator.success.network.missing");
			}
		}
		call.success(object);
	}

	/**
	 * Determines if the device is connected to an SSID
	 *
	 * Call must contain {@code String ssid}.
	 *
	 * TODO so this is the actual "associated" test, right? Clarify!
	 *
	 * @see AbstractConfigurator#isConnectedSSID(String)
	 */
	@PluginMethod
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	public void isConnectedSSID(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", true);
		boolean granted = requestPermission(Manifest.permission.ACCESS_FINE_LOCATION);
		if (!granted) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
		} else {
			if (getSSIDConfigurator().isConnectedSSID(call.getString("ssid"))) {
				object.put("isConnected", true);
				object.put("message", "plugin.wifieapconfigurator.success.network.connected");
			} else {
				object.put("isConnected", false);
				object.put("message", "plugin.wifieapconfigurator.error.network.notConnected");
			}
		}
		call.success(object);
	}

	@PluginMethod
	public void sendNotification(PluginCall call) {
		String stringDate = call.getString("date");
		String title = call.getString("title");
		String message = call.getString("message");

		// TODO this has nothing with SSIDs to do,
		// TODO so this should use an SSIDConfigurator, or any AbstractConfigurator
		getSSIDConfigurator().sendNotification(stringDate, title, message);

		// TODO no callback needed?
	}

	@PluginMethod()
	public void writeToSharedPref(PluginCall call) {
		// TODO this has nothing with SSIDs to do,
		// TODO so this should use an SSIDConfigurator, or any AbstractConfigurator
		getSSIDConfigurator().writeToSharedPref(call.getString("id"));

		JSObject object = new JSObject();
		object.put("success", true);
		object.put("message", "plugin.wifieapconfigurator.success.writing");
		call.success(object);
	}

	@PluginMethod()
	public void readFromSharedPref(PluginCall call) {
		JSObject object = new JSObject();

		// TODO this has nothing with SSIDs to do,
		// TODO so this should use an SSIDConfigurator, or any AbstractConfigurator
		String id = getSSIDConfigurator().readFromSharedPref();
		if (id == null || "".equals(id)) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.reading");
		} else {
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.reading");
			object.put("id", id);
		}
		call.success(object);
	}

	@PluginMethod()
	public void checkIfOpenThroughNotifications(PluginCall call) {
		boolean openFromNot = !getActivity().getComponentName().getClassName().contains("MainActivity");
		JSObject object = new JSObject();
		object.put("fromNotification", openFromNot);
		call.success(object);
	}

	/**
	 * Get the shared preferences object.
	 * Call edit() on the result to get the editor.
	 *
	 * @return Preferences object
	 */
	private SharedPreferences getPreferences() {
		return PreferenceManager.getDefaultSharedPreferences(getContext());

	}

	/**
	 * Install network suggestions
	 *
	 * This is a helper function that executes {@code SuggestionConfigurator#installSuggestions}
	 * and wraps any exception into a {@code WifiEapConfiguratorException}
	 *
	 * @param suggestionConfigurator The configurator to use
	 * @param suggestions            The suggestions to install
	 * @throws WifiEapConfiguratorException Exceptions are wrapped into this
	 * @see SuggestionConfigurator#installSuggestions(List)
	 */
	@RequiresApi(api = Build.VERSION_CODES.Q)
	private void installSuggestions(SuggestionConfigurator suggestionConfigurator, List<WifiNetworkSuggestion> suggestions) throws WifiEapConfiguratorException {
		try {
			suggestionConfigurator.installSuggestions(suggestions);
		} catch (NetworkSuggestionException e) {
			Log.e(getClass().getSimpleName(), e.getMessage());

			// Parenthesis for avoiding a NullPointerException when e.getMessage() is NULL
			// It won't be NULL, but this way we don't crash when it is anyway.
			throw new WifiEapConfiguratorException(("plugin.wifieapconfigurator.error.network." + e.getMessage()).toLowerCase(), e);
		}
	}

	/**
	 * Install a Passpoint network
	 *
	 * This is a helper function that executes {@code LegacyConfigurator#configurePasspoint}
	 * and stores the FQDN used, and wraps any exception into a {@code WifiEapConfiguratorException}
	 *
	 * @param legacyConfigurator The configurator to use
	 * @param passpointConfig    The passpoint configuration to install
	 * @throws WifiEapConfiguratorException Exceptions are wrapped into this
	 * @see LegacyConfigurator#configurePasspoint(PasspointConfiguration)
	 */
	private void configurePasspoint(LegacyConfigurator legacyConfigurator, PasspointConfiguration passpointConfig) throws WifiEapConfiguratorException {
		SharedPreferences.Editor editor = getPreferences().edit();
		String fqdn = passpointConfig.getHomeSp().getFqdn();

		try {
			legacyConfigurator.configurePasspoint(passpointConfig);

			editor.putString("fqdn", fqdn);
			editor.apply();
		} catch (NetworkInterfaceException e) {
			editor.remove("fqdn");
			editor.apply();

			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passpoint.unsupported", e);
		} catch (SecurityException e) {
			editor.remove("fqdn");
			editor.apply();

			Log.w("LegacyConfigurator", "SecurityException occurred, ");

			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passpoint.security", e);
		}
	}

	/**
	 * Requests the requested permissions from the operating system
	 *
	 * @param permissions All permissions to request
	 * @return Whether all provided permissions are granted
	 */
	private boolean requestPermission(String... permissions) {
		ArrayList<String> requestPermissions = new ArrayList<>(permissions.length);
		for (String permission : permissions) {
			if (!(checkSelfPermission(getContext(), permission) == PermissionChecker.PERMISSION_GRANTED)) {
				requestPermissions.add(permission);
			}
		}

		if (!requestPermissions.isEmpty()) {
			// TODO implement onRequestPermissionsResult somewhere
			ActivityCompat.requestPermissions(getActivity(), requestPermissions.toArray(new String[0]), 0);

			return false;
		}

		return true;
	}

	/**
	 * Get the most appropriate configurator to configure SSIDs on this device
	 *
	 * @return A configurator that can configure SSIDs on this device
	 */
	private AbstractConfigurator getSSIDConfigurator() {
		int targetSDK = getContext().getApplicationContext().getApplicationInfo().targetSdkVersion;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && targetSDK >= Build.VERSION_CODES.Q) {
			return new SuggestionConfigurator(getContext());
		}
		return new LegacyConfigurator(getContext());
	}
}
