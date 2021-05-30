package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.annotation.SuppressLint;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiNetworkSuggestion;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.annotation.RequiresPermission;
import androidx.core.app.ActivityCompat;
import androidx.core.content.PermissionChecker;

import com.emergya.wifieapconfigurator.config.AbstractConfigurator;
import com.emergya.wifieapconfigurator.config.LegacyConfigurator;
import com.emergya.wifieapconfigurator.config.SuggestionConfigurator;
import com.emergya.wifieapconfigurator.config.WifiProfile;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Arrays;

import static androidx.core.content.PermissionChecker.checkSelfPermission;

/**
 * Its the class responsable of communicate with ionic
 */
@NativePlugin(
	permissions = {
		Manifest.permission.ACCESS_WIFI_STATE,
		Manifest.permission.CHANGE_WIFI_STATE,
		Manifest.permission.ACCESS_FINE_LOCATION
	})
public class WifiEapConfigurator extends Plugin {

	/**
	 * Its the responsable of call to the methods for configure the networks
	 *
	 * @param call Capacitor object containing call made in ionic
	 */
	@RequiresApi(api = Build.VERSION_CODES.Q)
	@RequiresPermission(Manifest.permission.ACCESS_FINE_LOCATION)
	@PluginMethod()
	public void configureAP(PluginCall call) {
		JSObject object = new JSObject();

		try {
			WifiProfile profile = new WifiProfile(call.getData());

			// We prefer the legacy method, because it's more stable.
			// But Android blocks legacy SSID configurations from version Q,
			// and legacy Passpoint configurations from version R;
			// on and above these versions we have to use WifiNetworkSuggestions.
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
				if (!requestPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {
					throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.permission.notGranted");
				}

				// Everything must be done with suggestions
				// TODO We use suggestions directly, should we use intents?
				SuggestionConfigurator configurator = new SuggestionConfigurator(getContext());

				ArrayList<WifiNetworkSuggestion> suggestions = profile.makeSuggestions();
				configurator.installSuggestions(suggestions);
			} else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
				if (!requestPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {
					throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.permission.notGranted");
				}

				// We have to do SSIDs with suggestions and Passpoint with legacy
				SuggestionConfigurator suggestionConfigurator = new SuggestionConfigurator(getContext());
				LegacyConfigurator legacyConfigurator = new LegacyConfigurator(getContext());

				ArrayList<WifiNetworkSuggestion> suggestions = profile.makeSuggestions();
				suggestionConfigurator.installSuggestions(suggestions);

				PasspointConfiguration passpointConfiguration = profile.createPasspointConfig();
				try {
					legacyConfigurator.configurePasspoint(passpointConfiguration);
				} catch (WifiEapConfiguratorException e) {
					if (!"plugin.wifieapconfigurator.error.passpoint.linked".equals(e.getMessage())) {
						throw e;
					}
					Log.w("LegacyConfigurator", "IllegalArgumentException occurred, Passpoint disabled or unsupported on device?");
				}
			} else { // Everything below Q (below Android 10, below API version 29)
				// We get to use the legacy API for everything. YAY!

				LegacyConfigurator legacyConfigurator = new LegacyConfigurator(getContext());
				String[] ssids = profile.getSsids();

				WifiEnterpriseConfig enterpriseConfig = profile.createEnterpriseConfig();
				PasspointConfiguration passpointConfig = profile.createPasspointConfig();

				try {
					legacyConfigurator.removeNetwork(ssids);
				} catch (Throwable t) {
					/* ignore exceptions when removing the network,
					 * since many Android versions don't let us remove them,
					 * but allow us to override them
					 */
				}
				for (String ssid : ssids) {
					if (legacyConfigurator.isNetworkConfigured(ssid) && !legacyConfigurator.isNetworkOverrideable(ssid)) {
						throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.network.alreadyAssociated");
					}
				}
				for (String ssid : ssids) {
					legacyConfigurator.configureSSID(ssid, enterpriseConfig);
				}
				legacyConfigurator.configurePasspoint(passpointConfig);
			}

			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.linked");
		} catch (WifiEapConfiguratorException e) {
			Log.e("WifiEapConfigurator", e.getMessage());
			object.put("success", false);
			object.put("message", e.getMessage());

			// TODO this is how it should be done,
			// but the current JS code doesn't handle this well
			//Throwable cause = e.getCause();
			//call.error(e.getMessage(), cause instanceof Exception ? (Exception) cause : null);
		}

		call.success(object);
	}

	@PluginMethod
	public void validatePassPhrase(PluginCall call) {
		JSObject object = new JSObject();

		try {
			boolean success = WifiProfile.validatePassPhrase(call.getString("certificate"), call.getString("passPhrase"));

			object.put("success", success);
			if (success) {
				object.put("message", "plugin.wifieapconfigurator.success.passphrase.validation");
			} else {
				object.put("message", "plugin.wifieapconfigurator.error.passphrase.validation");
			}
		} catch (WifiEapConfiguratorException e) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.passphrase.validation");
		}

		call.success(object);
	}

	@PluginMethod
	@SuppressLint("MissingPermission")
	public void removeNetwork(PluginCall call) {
		JSObject object = new JSObject();
		String ssid = call.getString("ssid");
		if (ssid == null || "".equals(ssid)) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
		} else {
			getManagerForSSID().removeNetwork(call.getString("ssid"));
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.network.removed");
		}
		call.success(object);
	}

	@PluginMethod
	public void enableWifi(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false);
		try {
			getManagerForSSID().enableWifi();
			object.put("success", true);
			object.put("message", "plugin.wifieapconfigurator.success.wifi.enabled");
		} catch (WifiEapConfiguratorException e) {
			object.put("message", e.getMessage());
		}

		call.success(object);
	}

	@PluginMethod
	public boolean isNetworkAssociated(PluginCall call) throws JSONException {
		Object[] ssids = call.getArray("ssid").toList().toArray();
		return getManagerForSSID().areAnyNetworksConfigured(Arrays.copyOf(ssids, ssids.length, String[].class));
	}

	@PluginMethod
	@SuppressLint("MissingPermission")
	public void reachableSSID(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", false);
		boolean granted = requestPermission(Manifest.permission.ACCESS_FINE_LOCATION);
		if (!granted) {
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
		} else try {
			if (getManagerForSSID().reachableSSID(call.getString("ssid"))) {
				object.put("success", true);
				object.put("message", "plugin.wifieapconfigurator.success.network.reachable");
			} else {
				object.put("message", "plugin.wifieapconfigurator.success.network.missing");
			}
		} catch (WifiEapConfiguratorException e) {
			object.put("message", e.getMessage());
		}
		call.success(object);
	}

	@PluginMethod
	@SuppressLint("MissingPermission")
	public void isConnectedSSID(PluginCall call) {
		JSObject object = new JSObject();
		object.put("success", true);
		boolean granted = requestPermission(Manifest.permission.ACCESS_FINE_LOCATION);
		if (!granted) {
			object.put("success", false);
			object.put("message", "plugin.wifieapconfigurator.error.permission.notGranted");
		} else try {
			if (getManagerForSSID().isConnectedSSID(call.getString("ssid"), getActivity())) {
				object.put("isConnected", true);
				object.put("message", "plugin.wifieapconfigurator.success.network.connected");
			} else {
				object.put("isConnected", false);
				object.put("message", "plugin.wifieapconfigurator.error.network.notConnected");
			}
		} catch (WifiEapConfiguratorException e) {
			object.put("success", false);
			object.put("message", e.getMessage());
		}
		call.success(object);
	}

	@PluginMethod
	public void sendNotification(PluginCall call) {
		String stringDate = call.getString("date");
		String title = call.getString("title");
		String message = call.getString("message");

		// TODO this has nothing with SSIDs to do,
		// classes should be split
		getManagerForSSID().sendNotification(stringDate, title, message);

		// TODO no callback needed?
	}

	@PluginMethod()
	public void writeToSharedPref(PluginCall call) {
		// TODO this has nothing with SSIDs to do,
		// classes should be split
		getManagerForSSID().writeToSharedPref(call.getString("id"));

		JSObject object = new JSObject();
		object.put("success", true);
		object.put("message", "plugin.wifieapconfigurator.success.writing");
		call.success(object);
	}

	@PluginMethod()
	public void readFromSharedPref(PluginCall call) {
		JSObject object = new JSObject();

		// TODO this has nothing with SSIDs to do,
		// classes should be split
		String id = getManagerForSSID().readFromSharedPref();
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
	 * Requests permission to the app
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
			ActivityCompat.requestPermissions(getActivity(), requestPermissions.toArray(new String[0]), 123);

			return false;
		}

		return true;
	}

	private AbstractConfigurator getManagerForSSID() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			return new SuggestionConfigurator(getContext());
		}
		return new LegacyConfigurator(getContext());
	}
}
