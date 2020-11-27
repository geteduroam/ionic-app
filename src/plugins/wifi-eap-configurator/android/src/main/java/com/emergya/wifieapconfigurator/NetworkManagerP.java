package com.emergya.wifieapconfigurator;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiManager;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.os.Build;
import android.util.Log;

import androidx.preference.PreferenceManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

import java.util.ArrayList;
import java.util.List;

/**
 * NetworkManagerP is the responsable of implement the abstract methods of NetworkManager. This class
 * implements the methods to work in all devices with API less and equal than API 28.
 */
public class NetworkManagerP extends NetworkManager {

    public NetworkManagerP(ProfileDetails profile) {
        super(profile);
    }

    /**
     * Configure the network to work in devices with API 28 or less.
     * @param context
     * @param enterpriseConfig
     * @param call
     * @param passpointConfig
     * @param activity
     * @param ssid
     * @return
     */
    @Override
    public List connectNetwork(Context context, WifiEnterpriseConfig enterpriseConfig, PluginCall call, PasspointConfiguration passpointConfig, Activity activity, String ssid) {
        List result = new ArrayList();

        if (passpointConfig != null) {
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                removePasspoint(context, this.profileDetails.getId(), call);
            }
            result.add(connectPasspoint(context, passpointConfig, call));
        }

        if (ssid != null || !ssid.equals("")) {
            WifiManager myWifiManager = getWifiManager(context);
            WifiConfiguration config = new WifiConfiguration();
            config.SSID = "\"" + ssid + "\"";
            config.priority = 1;
            config.status = WifiConfiguration.Status.ENABLED;
            config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
            config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
            config.enterpriseConfig = enterpriseConfig;

            int wifiIndex = -1;
            try {
                wifiIndex = myWifiManager.addNetwork(config);
            } catch (java.lang.SecurityException e) {
                wifiIndex = -1; // redundant
                e.printStackTrace();
                Log.e("error", e.getMessage());
            }
            if (wifiIndex != -1) {
                myWifiManager.disconnect();
                myWifiManager.enableNetwork(wifiIndex, true);
                myWifiManager.reconnect();

                myWifiManager.setWifiEnabled(true);

                SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putInt("netId", wifiIndex);
                editor.putString("fqdn", passpointConfig.getHomeSp().getFqdn());
                editor.apply();

                JSObject object = new JSObject();
                object.put("success", true);
                object.put("message", "plugin.wifieapconfigurator.success.network.linked");
                result.add(object);
            } else {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.network.alreadyAssociated");
                result.add(object);
            }
        }

        return result;
    }

    @Override
    public boolean removeNetwork(String ssid, Context context) {
        WifiManager wm = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        String fqdn = sharedPref.getString("fqdn", "");
        try {
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("institutionId", "");
            editor.apply();
            @SuppressLint("MissingPermission") List<WifiConfiguration> configuredNetworks = wm.getConfiguredNetworks();
            for (WifiConfiguration conf : configuredNetworks) {
                if (conf.SSID.equals(ssid) || conf.SSID.equals("\"" + ssid + "\"")) { // TODO document why ssid can be surrounded by quotes
                    wm.removeNetwork(conf.networkId);
                    wm.saveConfiguration();
                }
            }
            if (!fqdn.equals("")) {
                try {
                    wm.removePasspointConfiguration(fqdn);
                } catch (Exception e) {
                    return false;
                }
            }
            return true;
        } catch(Exception ex) {
            return false;
        }
    }

    /**
     * Removes the passpoint configuration if exists in the device
     * @param context
     * @param id
     * @param call
     */
    private void removePasspoint(Context context, String id, PluginCall call) {
        List passpointsConfigurated;
        WifiManager wifiManager = getWifiManager(context);

        try {
            passpointsConfigurated = wifiManager.getPasspointConfigurations();
            int pos = 0;
            boolean enc = false;
            while (passpointsConfigurated.size() > pos && !enc) {
                if ((passpointsConfigurated.get(pos)).equals(id)) {
                    enc = true;
                } else {
                    pos++;
                }
            }
            if (enc) {
                wifiManager.removePasspointConfiguration(id);
            }
        } catch (IllegalArgumentException e) {
            Log.d("Passpoint", "removePasspoint: " + e);
        } catch (Exception e) {
            Log.d("Passpoint", "removePasspoint: " + e);
        }
    }

    /**
     * Configures the passpoint in the device if this have available passpoint
     * @param context
     * @param config
     * @param call
     * @return
     */
    private JSObject connectPasspoint(Context context, PasspointConfiguration config, PluginCall call) {
        try {
            getWifiManager(context).addOrUpdatePasspointConfiguration(config);
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.passpoint.linked");
            return object;
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.linked");
            return object;
        } catch (Exception e) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.not.enabled");
            return object;
        }
    }

}
