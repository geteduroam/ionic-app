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
import android.net.wifi.WifiInfo;
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

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;

import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import static android.support.v4.content.ContextCompat.startActivity;
import static android.support.v4.content.PermissionChecker.checkSelfPermission;
import static java.lang.System.in;

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

        String clientCertificate = null;
        if (call.getString("clientCertificate") != null && !call.getString("clientCertificate").equals("")) {
            clientCertificate = call.getString("clientCertificate");
        }

        String passPhrase = null;
        if (call.getString("passPhrase") != null && !call.getString("passPhrase").equals("")) {
            passPhrase = call.getString("passPhrase");
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
                || call.getInt("eap") == 25)) {
            eap = call.getInt("eap");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.eap.missing");
            call.success(object);
            res = false;
        }

        String servername = null;
        if (call.getString("servername") != null && !call.getString("servername").equals("")) {
            servername = call.getString("servername");
        }

        String username = null;
        String password = null;
        Integer auth = null;

        if(clientCertificate==null && passPhrase==null){
            if (call.getString("username") != null && !call.getString("username").equals("") ) {
                username = call.getString("username");
            } else {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.username.missing");
                call.success(object);
                res = false;
            }

            if (call.getString("password") != null && !call.getString("password").equals("")) {
                password = call.getString("password");
            } else {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.password.missing");
                call.success(object);
                res = false;
            }


            if (call.getInt("auth") != null) {
                auth = call.getInt("auth");
            } else {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.auth.missing");
                call.success(object);
                res = false;
            }
        }

        if (res) {
            res = getNetworkAssociated(call, ssid);
        }

        if (res) {
            connectAP(ssid, username, password, servername, caCertificate, clientCertificate, passPhrase, eap, auth, anonymousIdentity, call);
        }
    }

    void connectAP(String ssid, String username, String password, String servername, String caCertificate, String clientCertificate, String passPhrase,
                   Integer eap, Integer auth, String anonymousIdentity, PluginCall call) {

        WifiConfiguration config = new WifiConfiguration();

        config.SSID = "\"" + ssid + "\"";
        config.priority = 1;
        WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

        config.status = WifiConfiguration.Status.ENABLED;

        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);

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

        if((clientCertificate==null || clientCertificate.equals("")) && (passPhrase==null|| passPhrase.equals(""))){
            enterpriseConfig.setIdentity(username);
            enterpriseConfig.setPassword(password);

            Integer authMethod = getAuthMethod(auth, call);
            enterpriseConfig.setPhase2Method(authMethod);

        }else{

            KeyStore pkcs12ks = null;
            try {
                pkcs12ks = KeyStore.getInstance("pkcs12");

                byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
                ByteArrayInputStream b = new ByteArrayInputStream(bytes);
                InputStream in= new BufferedInputStream(b);
                pkcs12ks.load(in, passPhrase.toCharArray());

                Enumeration<String> aliases = pkcs12ks.aliases();

                while (aliases.hasMoreElements()) {
                    String alias = aliases.nextElement();

                    X509Certificate cert = (X509Certificate) pkcs12ks.getCertificate(alias);

                    PrivateKey key = (PrivateKey) pkcs12ks.getKey(alias, passPhrase.toCharArray());

                    enterpriseConfig.setClientKeyEntry(key, cert);
                }

            } catch (KeyStoreException e) {
                sendClientCertificateError(e, call);
                e.printStackTrace();
            }catch (CertificateException e) {
                sendClientCertificateError(e, call);
                e.printStackTrace();
            } catch (IOException e) {
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

    private void sendClientCertificateError(Exception e, PluginCall call){
        JSObject object = new JSObject();
        object.put("success", false);
        object.put("message", "plugin.wifieapconfigurator.error.clientCertificate.invalid - " + e.getMessage());
        call.success(object);
        Log.e("error", e.getMessage());
    }

    @PluginMethod
    public boolean removeNetwork(PluginCall call) {
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
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\""+ssid.toLowerCase()+"\"")) {
                wifi.removeNetwork(conf.networkId);
                wifi.saveConfiguration();
                JSObject object = new JSObject();
                object.put("success", true);
                object.put("message", "plugin.wifieapconfigurator.success.network.removed");
                call.success(object);
                res = true;
            }
        }
        if (!res) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.success.network.missing");
            call.success(object);
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
        boolean res = false, isOverridable = false;
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
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\""+ssid.toLowerCase()+"\"")) {

                String packageName = getContext().getPackageName();
                if (conf.toString().toLowerCase().contains(packageName.toLowerCase())) {
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

        return res;
    }

    @PluginMethod
    public void reachableSSID(PluginCall call) {
        String ssid = null;
        boolean isReachable = false;
        if (call.getString("ssid") != null && !call.getString("ssid").equals("")) {
            ssid = call.getString("ssid");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
            call.success(object);
        }

        boolean granted = getPermission(call);

        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (!location) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.location.disabled");
            call.success(object);
        } else if (granted) {

            WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            Iterator<ScanResult> results = wifiManager.getScanResults().iterator();

            while (isReachable == false && results.hasNext()) {
                ScanResult s = results.next();
                if (s.SSID.toLowerCase().equals(ssid.toLowerCase()) || s.SSID.toLowerCase().equals("\""+ssid.toLowerCase()+"\"")) {
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

    @PluginMethod
    public void isConnectedSSID(PluginCall call) {
        String ssid = null;
        boolean isConnected = false;
        if (call.getString("ssid") != null && !call.getString("ssid").equals("")) {
            ssid = call.getString("ssid");
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
            call.success(object);
        }

        boolean granted = getPermission(call);

        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean location = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (!location) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.location.disabled");
            call.success(object);
        } else if (granted) {
            WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            WifiInfo info = wifiManager.getConnectionInfo();
            String currentlySsid = info.getSSID();
            if (currentlySsid != null && (currentlySsid.toLowerCase().equals("\"" + ssid.toLowerCase() + "\"") || currentlySsid.toLowerCase().equals(ssid.toLowerCase()))) {
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

    private boolean getNetworkAssociated(PluginCall call, String ssid) {
        boolean res = true, isOverridable = false;

        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\""+ssid.toLowerCase()+"\"")) {
                String packageName = getContext().getPackageName();
                if (conf.toString().toLowerCase().contains(packageName.toLowerCase())) {
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

        return res;
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

    boolean getPermission(PluginCall call) {
        boolean res = true;
        if (checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            res = false;
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 123);
        }
        return res;
    }

}
