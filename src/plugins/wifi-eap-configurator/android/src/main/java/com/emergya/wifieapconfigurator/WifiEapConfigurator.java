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

import static android.support.v4.content.PermissionChecker.checkSelfPermission;

@NativePlugin()
public class WifiEapConfigurator extends Plugin {

    List<ScanResult> results = null;

    @PluginMethod()
    public void configureAP(PluginCall call) {
        String ssid = null;
        boolean res = true;
        if (call.getString("ssid") != "" && call.getString("ssid") != null) {
            ssid = call.getString("ssid");
        } else {
            call.reject("Missing the wifi's ssid");
            res = false;
        }

        String username = null;
        if (call.getString("username") != "" && call.getString("username") != null) {
            username = call.getString("username");
        } else {
            call.reject("Missing username");
            res = false;
        }

        String password = null;
        if (call.getString("password") != "" && call.getString("password") != null) {
            password = call.getString("password");
        } else {
            call.reject("Missing password");
            res = false;
        }

        String servername = null;
        if (call.getString("servername") != null && call.getString("servername") != "") {
            servername = call.getString("servername");
        } /*else {
            call.reject("Missing servername");
            res = false;
        }*/

        String anonymousIdentity = null;
        if (call.getString("anonymous") != null && call.getString("anonymous") != "") {
            anonymousIdentity = call.getString("anonymous");
        }

        String caCertificate = null;
        if (call.getString("caCertificate") != null && call.getString("caCertificate") != "") {
            caCertificate = call.getString("caCertificate");
        }

        Integer eap = null;
        if (call.getInt("eap") != null && (call.getInt("eap") == 13 || call.getInt("eap") == 21
                || call.getInt("eap") == 25)) {//13 21 25
            eap = call.getInt("eap");
        } else {
            call.reject("Missing eap type");
            res = false;
        }

        Integer auth = null;
        if (call.getInt("auth") != null) {
            auth = call.getInt("auth");
        } else {
            call.reject("Missing auth type");
            res = false;
        }

        if (res) {
            res = checkEnabledWifi(call);
        }

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
        if(anonymousIdentity!=null && anonymousIdentity!=""){
            enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
        }
        if(servername != null && servername != ""){
            enterpriseConfig.setDomainSuffixMatch(servername);
        }
        Integer eapMethod = getEapMethod(eap, call);
        enterpriseConfig.setEapMethod(eapMethod);
        Integer authMethod = getAuthMethod(auth, call);
        enterpriseConfig.setPhase2Method(authMethod);

        CertificateFactory certFactory = null;
        X509Certificate caCert = null;
        if (caCertificate != null && caCertificate != "") {
            byte[] bytes = Base64.decode(caCertificate, Base64.NO_WRAP);
            ByteArrayInputStream b = new ByteArrayInputStream(bytes);

            try {
                certFactory = CertificateFactory.getInstance("X.509");
                caCert = (X509Certificate) certFactory.generateCertificate(b);

                enterpriseConfig.setCaCertificate(caCert);
            } catch (CertificateException e) {
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

    }

    boolean checkEnabledWifi(PluginCall call) {
        boolean res = true;
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        if (wifi.isWifiEnabled() == false) {
            call.reject("Wifi disabled");
            res = false;
        }
        return res;
    }

    private boolean getNetworkAssociated(PluginCall call, String ssid) {
        boolean res = true;

        /*LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean gps_enabled = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (!gps_enabled) {
            call.reject("Location disabled");
            res = false;
        }*/

        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().contains(ssid.toLowerCase())) {
                call.reject("Network already associated");
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
                call.reject("Invalid eap");
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
            default:
                call.reject("Invalid auth");
                res = 0;
                break;
        }
        return res;
    }

}
