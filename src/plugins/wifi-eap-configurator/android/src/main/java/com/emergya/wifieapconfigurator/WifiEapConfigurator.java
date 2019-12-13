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
    ScanResult res = null;

    @PluginMethod()
    public void test(PluginCall call) {
        String ssid = null;
        if (call.getString("ssid") != "" && call.getString("ssid") != null) {
            ssid = call.getString("ssid");
        } else {
            call.reject("Missing the wifi's ssid");
        }

        String username = null;
        if (call.getString("username") != "" && call.getString("username") != null) {
            username = call.getString("username");
        } else {
            call.reject("Missing Username");
        }

        String password = null;
        if (call.getString("password") != "" && call.getString("password") != null) {
            password = call.getString("password");
        } else {
            call.reject("Missing Password");
        }

        String servername = null;
        if (call.getString("servername") != "" && call.getString("servername") != null) {
            servername = call.getString("servername");
        } else {
            call.reject("Missing servername");
        }

        String caCertificate = null;
        if (call.getString("caCertificate") != "" && call.getString("caCertificate") != null) {
            caCertificate = call.getString("caCertificate");
        }

        Integer eap = null;
        if (call.getInt("eap") != null &&  (call.getInt("eap") == 13 || call.getInt("eap") == 21
                || call.getInt("eap") == 25)) {//13 21 25
            eap = call.getInt("eap");
        } else {
            call.reject("Missing eap type");
        }

        Integer auth = null;
        if (call.getInt("auth") != null && call.getInt("auth") != 26) { //26
            auth = call.getInt("auth");
        } else {
            call.reject("Missing auth type");
        }


        getPermission();

        checkEnabledWifi(call);

        getWifiBySSID(call, ssid);

        configPEAP(ssid, username, password, servername, caCertificate, eap, auth);


    }

    void checkEnabledWifi(PluginCall call) {
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        if (wifi.isWifiEnabled() == false) {
            call.reject("Wifi disabled");
        }
    }

    void getWifiBySSID(PluginCall call, String ssid) {
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean gps_enabled = false;

        try {
            gps_enabled = lm.isProviderEnabled(LocationManager.GPS_PROVIDER);
           /* results = wifi.getScanResults();
            Log.i("bien",results.toString());
            for (ScanResult s : results) {
                if(s.SSID.toLowerCase().contains(ssid.toLowerCase())){
                    res = s;
                    break;
                }
            }
            Log.i("bien","res "+(res!=null?res.toString():"nulo"));*/
        } catch (Exception ex) {
            call.reject("Location error");
        }

        if (!gps_enabled) {
            call.reject("Location disabled");
        }
    }

    Integer getEapMethod(Integer eap){
        Integer res = null;
        switch (eap){
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
                res = 0;
                break;
        }
        return res;
    }

    void configPEAP(String ssid, String username, String password, String servername, String caCertificate, Integer eap, Integer auth) {
        WifiConfiguration config = new WifiConfiguration();

        config.SSID = "\""+ssid+"\"";
        config.priority = 1;
        WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();
       /* CertificateFactory certFactory = null;
        X509Certificate caCert = null;


        if(caCertificate!= null && caCertificate!=""){
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
        }*/

        config.status = WifiConfiguration.Status.ENABLED;

        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
        enterpriseConfig.setIdentity(username);
        enterpriseConfig.setPassword(password);
        enterpriseConfig.setDomainSuffixMatch(servername);
        Integer eapMethod = getEapMethod(eap);
        enterpriseConfig.setEapMethod(eapMethod);
        enterpriseConfig.setPhase2Method(auth);

        //enterpriseConfig.setEapMethod(WifiEnterpriseConfig.Eap.TTLS);
        //enterpriseConfig.setPhase2Method(WifiEnterpriseConfig.Phase2.PAP);

        config.enterpriseConfig = enterpriseConfig;

        WifiManager myWifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        int id = myWifiManager.addNetwork(config);
        myWifiManager.disconnect();
        myWifiManager.enableNetwork(id, true);
        myWifiManager.reconnect();

    }

    void getPermission() {

        if (checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 123);
        }

        if (checkSelfPermission(getContext(), Manifest.permission.ACCESS_WIFI_STATE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_WIFI_STATE}, 123);
        }

        if (checkSelfPermission(getContext(), Manifest.permission.CHANGE_WIFI_STATE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.CHANGE_WIFI_STATE}, 123);
        }
        if (checkSelfPermission(getContext(), Manifest.permission.ACCESS_NETWORK_STATE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_NETWORK_STATE}, 123);
        }
    }
}
