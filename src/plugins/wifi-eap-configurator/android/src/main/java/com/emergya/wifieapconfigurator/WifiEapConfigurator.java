package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.ActivityCompat;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginResult;

import java.io.ByteArrayInputStream;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.List;

import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import static android.support.v4.content.ContextCompat.startActivity;
import static android.support.v4.content.PermissionChecker.checkSelfPermission;

@NativePlugin()
public class WifiEapConfigurator extends Plugin {

    List<ScanResult> results = null;

    @PluginMethod()
    public void configureAP(PluginCall call) {
        String ssid = null;
        boolean res = true;
        if (!call.getString("ssid").equals("") && call.getString("ssid") != null) {
            ssid = call.getString("ssid");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
            call.success(object);
            res = false;
        }

        String username = null;
        if (!call.getString("username").equals("") && call.getString("username") != null) {
            username = call.getString("username");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.username.missing");
            call.success(object);
            res = false;
        }

        String password = null;
        if (!call.getString("password").equals("") && call.getString("password") != null) {
            password = call.getString("password");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.password.missing");
            call.success(object);
            res = false;
        }

        String servername = null;
        if (call.getString("servername") != null && !call.getString("servername").equals("")) {
            servername = call.getString("servername");
        }

        String anonymousIdentity = null;
        if (call.getString("anonymous") != null && !call.getString("anonymous").equals("")) {
            anonymousIdentity = call.getString("anonymous");
        }

        String caCertificate = null;
        if (call.getString("caCertificate") != null && !call.getString("caCertificate").equals("")) {
            caCertificate = call.getString("caCertificate");
        }

        Integer eap = null;
        if (call.getInt("eap") != null && (call.getInt("eap") == 13 || call.getInt("eap") == 21
                || call.getInt("eap") == 25)) {//13 21 25
            eap = call.getInt("eap");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.eap.missing");
            call.success(object);
            res = false;
        }

        Integer auth = null;
        if (call.getInt("auth") != null) {
            auth = call.getInt("auth");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.auth.missing");
            call.success(object);
            res = false;
        }

       /* if (res) {
            res = checkEnabledWifi(call);
        }*/

        if (res) {
            res = getNetworkAssociated(call, ssid);
        }

        if (res) {
            connectAP(ssid, username, password, servername, caCertificate, eap, auth, anonymousIdentity, call);
        }
    }

    void connectAP(String ssid, String username, String password, String servername, String caCertificate,
                   Integer eap, Integer auth, String anonymousIdentity, PluginCall call) {

        WifiConfiguration config = new WifiConfiguration();

        config.SSID = "\"" + ssid + "\"";
        config.priority = 1;
        WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

        config.status = WifiConfiguration.Status.ENABLED;

        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
        enterpriseConfig.setIdentity(username);
        enterpriseConfig.setPassword(password);
        if (anonymousIdentity != null && !anonymousIdentity.equals("")) {
            enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
        }
        if (servername != null && !servername.equals("")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                enterpriseConfig.setDomainSuffixMatch(servername);
            }
        }
        Integer eapMethod = getEapMethod(eap, call);
        enterpriseConfig.setEapMethod(eapMethod);
        Integer authMethod = getAuthMethod(auth, call);
        enterpriseConfig.setPhase2Method(authMethod);

        CertificateFactory certFactory = null;
        X509Certificate caCert = null;
        if (caCertificate != null && !caCertificate.equals("")) {
            byte[] bytes = Base64.decode(caCertificate, Base64.NO_WRAP);
            ByteArrayInputStream b = new ByteArrayInputStream(bytes);

            try {
                certFactory = CertificateFactory.getInstance("X.509");
                caCert = (X509Certificate) certFactory.generateCertificate(b);
                enterpriseConfig.setCaCertificate(caCert);
            } catch (CertificateException e) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
                call.success(object);
                e.printStackTrace();
                Log.e("error", e.getMessage());
            } catch (IllegalArgumentException e) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
                call.success(object);
                e.printStackTrace();
                Log.e("error", e.getMessage());
            }
        }

        config.enterpriseConfig = enterpriseConfig;

        WifiManager myWifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        int id = myWifiManager.addNetwork(config);
        myWifiManager.disconnect();
        myWifiManager.enableNetwork(id, true);
        myWifiManager.reconnect();

        WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        wifiManager.setWifiEnabled(true);

        JSObject object = new JSObject();
        object.put("success", true);
        object.put("message", "plugin.wifieapconfigurator.success.network.linked");
        call.success(object);

    }

    boolean checkEnabledWifi(PluginCall call) {
        boolean res = true;
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        if (!wifi.isWifiEnabled()) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
            call.success(object);
            res = false;
        }
        return res;
    }

    @PluginMethod
    public void enableWifi(PluginCall call) {

        WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
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

    }

    @PluginMethod
    public boolean isNetworkAssociated(PluginCall call) {
        String ssid = null;
        boolean res = false;
        if (call.getString("ssid") != null && !call.getString("ssid").equals("")) {
            ssid = call.getString("ssid");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
            call.success(object);
            return res;
        }

        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().contains(ssid.toLowerCase())) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.network.alreadyAssociated");
                object.put("overridable", false);
                call.success(object);
                res = true;
                break;
            }
        }
        if(!res){
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.network.missing");
            call.success(object);
        }

        return res;
    }

    private boolean getNetworkAssociated(PluginCall call, String ssid) {
        boolean res = true;

        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().contains(ssid.toLowerCase())) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.network.alreadyAssociated");
                object.put("overridable", false);
                call.success(object);
                res = false;
                break;
            }
        }

        return res;
    }

    private Integer getEapMethod(Integer eap, PluginCall call) {
        Integer res = null;
        switch (eap) {
            case 13:
                res = WifiEnterpriseConfig.Eap.TLS;
                break;
            case 21:
                res = WifiEnterpriseConfig.Eap.TTLS;
                break;
            case 25:
                res = WifiEnterpriseConfig.Eap.PEAP;
                break;
            default:
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.eap.invalid");
                call.success(object);
                res = 0;
                break;
        }
        return res;
    }

    private Integer getAuthMethod(Integer auth, PluginCall call) {
        Integer res = null;
        switch (auth) {
            case 3:
                res = WifiEnterpriseConfig.Phase2.MSCHAP;
                break;
            case 4:
                res = WifiEnterpriseConfig.Phase2.MSCHAPV2;
                break;
            case 5:
                res = WifiEnterpriseConfig.Phase2.PAP;
                break;
            case 6:
                res = WifiEnterpriseConfig.Phase2.GTC;
                break;
            default:
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.auth.invalid");
                call.success(object);
                res = 0;
                break;
        }
        return res;
    }

}
