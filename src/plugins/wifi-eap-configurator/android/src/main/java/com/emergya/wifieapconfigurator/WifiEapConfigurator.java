package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.FeatureInfo;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.ScanResult;
import android.net.wifi.hotspot2.ConfigParser;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.net.wifi.hotspot2.pps.HomeSp;
import android.net.wifi.hotspot2.pps.Credential;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
//import android.net.wifi.WifiNetworkSuggestion;
//import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.security.KeyChain;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
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
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.ArrayList;

import static androidx.core.content.PermissionChecker.checkSelfPermission;

@NativePlugin(
        permissions = {
                Manifest.permission.ACCESS_WIFI_STATE,
                Manifest.permission.CHANGE_WIFI_STATE,
                Manifest.permission.ACCESS_FINE_LOCATION
        })
public class WifiEapConfigurator extends Plugin {

    List<ScanResult> results = null;

    @PluginMethod()
    public void configureAP(PluginCall call) {
        String ssid = null;
        boolean res = true;

        String oid = null;
        if (call.getString("oid") != null && !call.getString("oid").equals("")) {
            oid = call.getString("oid");
        }

        try {
            if (!call.getArray("oid").toList().isEmpty() && !call.getArray("oid").toList().get(0).equals("")) {
                List aux = new ArrayList();
                aux = call.getArray("oid").toList();
                oid = aux.get(0).toString();
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (!call.getString("ssid").equals("") && call.getString("ssid") != null) {
            ssid = call.getString("ssid");

        } else {
            // ssid OR oid are mandatory 
            if (oid == null) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
                call.success(object);
                res = false;
            }
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

        String id = null;
        if (call.getString("id") != null && !call.getString("id").equals("")) {
            id = call.getString("id");
        }
        String displayName = null;
        if (call.getString("displayName") != null && !call.getString("displayName").equals("")) {
            displayName = call.getString("displayName");
        }

        if (clientCertificate == null && passPhrase == null) {
            if (call.getString("username") != null && !call.getString("username").equals("")) {
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
            connectAP(ssid, username, password, servername, caCertificate, clientCertificate, passPhrase, eap, auth, anonymousIdentity, displayName, id, oid, call);
        }
    }

    void connectAP(String ssid, String username, String password, String servername, String caCertificate, String clientCertificate, String passPhrase,
                   Integer eap, Integer auth, String anonymousIdentity, String displayName, String id, String oid, PluginCall call) {

        WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

        if (anonymousIdentity != null && !anonymousIdentity.equals("")) {
            enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
        }

        if (servername != null && !servername.equals("")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                String longestCommonSuffix = null;
                if (call.getString("longestCommonSuffix") != null && !call.getString("longestCommonSuffix").trim().equals("")) {
                    longestCommonSuffix = call.getString("longestCommonSuffix");
                    enterpriseConfig.setDomainSuffixMatch(longestCommonSuffix);
                }
                // now we have to configure the DNS
                String[] servernames = servername.split(";");
                for (int i = 0; i < servernames.length; i++) {
                    servernames[i] = "DNS:" + servernames[i];
                }
                enterpriseConfig.setAltSubjectMatch(String.join(";", servernames));
            }
        }

        Integer eapMethod = getEapMethod(eap, call);
        enterpriseConfig.setEapMethod(eapMethod);

        CertificateFactory certFactory = null;
        X509Certificate[] caCerts = null;
        List<X509Certificate> certificates = new ArrayList<X509Certificate>();
        if (caCertificate != null && !caCertificate.equals("")) {
            // Multi CA-allowing
            String[] caCertificates = caCertificate.split(";");
            // building the certificates
            for (String certString : caCertificates) {
                byte[] bytes = Base64.decode(certString, Base64.NO_WRAP);
                ByteArrayInputStream b = new ByteArrayInputStream(bytes);

                try {
                    certFactory = CertificateFactory.getInstance("X.509");
                    certificates.add((X509Certificate) certFactory.generateCertificate(b));
                } catch (CertificateException e) {
                    JSObject object = new JSObject();
                    object.put("success", false);
                    object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
                    call.success(object);
                    e.printStackTrace();
                    Log.e("error", e.getMessage());
                    return;
                } catch (IllegalArgumentException e) {
                    JSObject object = new JSObject();
                    object.put("success", false);
                    object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
                    call.success(object);
                    e.printStackTrace();
                    Log.e("error", e.getMessage());
                    return;
                }
            }
            // Adding the certificates to the configuration
            caCerts = certificates.toArray(new X509Certificate[certificates.size()]);
            try {
                enterpriseConfig.setCaCertificates(caCerts);
            } catch (IllegalArgumentException e) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.ca.invalid");
                call.success(object);
                e.printStackTrace();
                Log.e("error", e.getMessage());
                return;
            }
        }

        X509Certificate cert = null;
        PrivateKey key = null;

        if ((clientCertificate == null || clientCertificate.equals("")) && (passPhrase == null || passPhrase.equals(""))) {
            enterpriseConfig.setIdentity(username);
            enterpriseConfig.setPassword(password);

            Integer authMethod = getAuthMethod(auth, call);
            enterpriseConfig.setPhase2Method(authMethod);

        } else {

            try {
                KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

                byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
                ByteArrayInputStream b = new ByteArrayInputStream(bytes);
                InputStream in = new BufferedInputStream(b);

                pkcs12ks.load(in, passPhrase.toCharArray());

                Enumeration<String> aliases = pkcs12ks.aliases();

                while (aliases.hasMoreElements()) {
                    String alias = aliases.nextElement();
                    cert = (X509Certificate) pkcs12ks.getCertificate(alias);
                    key = (PrivateKey) pkcs12ks.getKey(alias, passPhrase.toCharArray());
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
            } catch(Exception e) {
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.passphrase.null");
                call.success(object);
                e.printStackTrace();
                Log.e("error", e.getMessage());
                return;
            }
        }

        WifiManager myWifiManager = (WifiManager) getContext().getSystemService(Context.WIFI_SERVICE);

        if (ssid != null) {
            connectWifiBySsid(myWifiManager, ssid, enterpriseConfig, call, displayName);
        }

        /*if (oid != null) {
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                removePasspoint(myWifiManager, id, call);
            }
            connectPasspoint(myWifiManager, id, displayName, oid, enterpriseConfig, call, caCertificate, key);
        }*/

        /*if (connectWifiAndroidQ(ssid, enterpriseConfig, passpointConfig)) {
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.network.linked");
            call.success(object);
        } else {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.success.network.reachable");
            call.success(object);
        }*/
    }

    @PluginMethod
    public void validatePassPhrase(PluginCall call) throws KeyStoreException, CertificateException, NoSuchAlgorithmException, IOException {

        String clientCertificate = call.getString("certificate");
        String passPhrase = call.getString("passPhrase");

        KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

        byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
        ByteArrayInputStream b = new ByteArrayInputStream(bytes);
        InputStream in = new BufferedInputStream(b);

        try {
            pkcs12ks.load(in, passPhrase.toCharArray());
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

    private void removePasspoint(WifiManager wifiManager, String id, PluginCall call) {
        List passpointsConfigurated = new ArrayList();
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
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.remove");
            call.success(object);
            e.printStackTrace();
            Log.e("error", e.getMessage());
        } catch (Exception e) {
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.not.enabled");
            call.success(object);
            e.printStackTrace();
            Log.e("PasspointConfiguration", e.getMessage());
        }
    }

    private void connectPasspoint(WifiManager wifiManager, String id, String displayName, String oid, WifiEnterpriseConfig enterpriseConfig, PluginCall call, String cert, PrivateKey key) {

        PasspointConfiguration config = new PasspointConfiguration();

        HomeSp homeSp = new HomeSp();
        homeSp.setFqdn(id);

        if (displayName != null) {
            homeSp.setFriendlyName(displayName);
        } else {
            homeSp.setFriendlyName("#Passpoint");
        }
        String[] consortiumOIDs = oid.split(";");
        long[] roamingConsortiumOIDs = new long[consortiumOIDs.length];
        int index = 0;
        for (String roamingConsortiumOIDString : consortiumOIDs) {
            if (!roamingConsortiumOIDString.startsWith("0x")) {
                roamingConsortiumOIDString = "0x" + roamingConsortiumOIDString;
            }
            roamingConsortiumOIDs[index] = Long.decode(roamingConsortiumOIDString);
            index++;
        }
        homeSp.setRoamingConsortiumOis(roamingConsortiumOIDs);
        config.setHomeSp(homeSp);
        Credential cred = new Credential();
        cred.setRealm(id);

        if (this.getEapType(enterpriseConfig.getEapMethod(), call) == 13) {
            Credential.CertificateCredential certCred = new Credential.CertificateCredential();
            certCred.setCertType("x509v3");
            cred.setClientCertificateChain(enterpriseConfig.getClientCertificateChain());
            cred.setClientPrivateKey(key);
            certCred.setCertSha256Fingerprint(getFingerprint(enterpriseConfig.getClientCertificateChain()[0]));
            cred.setCertCredential(certCred);
        } else {
            Credential.UserCredential us = new Credential.UserCredential();
            us.setUsername(enterpriseConfig.getIdentity());
            us.setPassword(enterpriseConfig.getPassword());
            us.setEapType(21);
            us.setNonEapInnerMethod("MS-CHAP-V2");
            cred.setUserCredential(us);
        }

        cred.setCaCertificate(enterpriseConfig.getCaCertificate());
        config.setCredential(cred);

        try {
            wifiManager.addOrUpdatePasspointConfiguration(config);
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.passpoint.linked");
        } catch (IllegalArgumentException e) {
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.linked");
            call.success(object);
            e.printStackTrace();
            Log.e("error", e.getMessage());
        } catch (Exception e){
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.error.passpoint.not.enabled");
            call.success(object);
            e.printStackTrace();
            Log.e("error", e.getMessage());
        }
    }

    private void connectWifiBySsid(WifiManager myWifiManager, String ssid, WifiEnterpriseConfig enterpriseConfig, PluginCall call, String displayName) {
        WifiConfiguration config = new WifiConfiguration();
        config.SSID = "\"" + ssid + "\"";
        config.priority = 1;
        config.status = WifiConfiguration.Status.ENABLED;
        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
        config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
        config.enterpriseConfig = enterpriseConfig;

        try {
            int wifiIndex = myWifiManager.addNetwork(config);
            myWifiManager.disconnect();
            myWifiManager.enableNetwork(wifiIndex, true);
            myWifiManager.reconnect();

            WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            wifiManager.setWifiEnabled(true);

            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.network.linked");
            call.success(object);
        } catch (java.lang.SecurityException e) {
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.network.linked");
            call.success(object);
            e.printStackTrace();
            Log.e("error", e.getMessage());
        }
    }

    /*private boolean createSuggestion(WifiManager wifiManager, String ssid, WifiEnterpriseConfig enterpriseConfig, PasspointConfiguration passpointConfig){
            boolean configured = false;
            if (getPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {

                ArrayList<WifiNetworkSuggestion> suggestions = new ArrayList<>();
                WifiNetworkSuggestion.Builder suggestionBuilder =  new WifiNetworkSuggestion.Builder();

                if (ssid != null) {
                    suggestionBuilder.setSsid(ssid);
                }
                suggestionBuilder.setWpa2EnterpriseConfig(enterpriseConfig);

                if (passpointConfig != null && Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
                    suggestionBuilder.setPasspointConfig(passpointConfig);
                }
                final WifiNetworkSuggestion suggestion = suggestionBuilder.build();

                // WifiNetworkSuggestion approach
                suggestions.add(suggestion);

                wifiManager.removeNetworkSuggestions(new ArrayList<WifiNetworkSuggestion>());
                int status = wifiManager.addNetworkSuggestions(suggestions);

                if (status == WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS) {

                    final IntentFilter intentFilter =
                            new IntentFilter(WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION);

                    final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
                        @Override
                        public void onReceive(Context context, Intent intent) {
                            if (!intent.getAction().equals(
                                    WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION)) {
                                return;
                            }
                        }
                    };
                    getContext().registerReceiver(broadcastReceiver, intentFilter);

                    configured = true;
                } else {
                    Log.d("STATUS ERROR", "" + status);
                    configured = false;
                }
            }
            return configured;

    }*/

    /*
    private boolean connectWifiAndroidQ(String ssid, WifiEnterpriseConfig enterpriseConfig, PasspointConfiguration passpointConfig) {
        boolean configured = false;
        if (getPermission(Manifest.permission.CHANGE_NETWORK_STATE)) {

            ArrayList<WifiNetworkSuggestion> suggestions = new ArrayList<>();
            WifiNetworkSuggestion.Builder suggestionBuilder =  new WifiNetworkSuggestion.Builder();

            suggestionBuilder.setSsid(ssid);
            suggestionBuilder.setWpa2EnterpriseConfig(enterpriseConfig);

            if (passpointConfig != null) {
                suggestionBuilder.setPasspointConfig(passpointConfig);
            }
            final WifiNetworkSuggestion suggestion = suggestionBuilder.build();

            // WifiNetworkSuggestion approach
            suggestions.add(suggestion);
            WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            int status = wifiManager.addNetworkSuggestions(suggestions);

            if (status == WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS) {

                final IntentFilter intentFilter =
                        new IntentFilter(WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION);

                final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        if (!intent.getAction().equals(
                                WifiManager.ACTION_WIFI_NETWORK_SUGGESTION_POST_CONNECTION)) {
                            return;
                        }
                    }
                };
                getContext().registerReceiver(broadcastReceiver, intentFilter);

                configured = true;
            } else {
                Log.d("STATUS ERROR", "" + status);
                configured = false;
            }
        }
        return configured;
    }*/

    private void sendClientCertificateError(Exception e, PluginCall call) {
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

        /*if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) { */
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();
        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\"" + ssid.toLowerCase() + "\"")) {
                wifi.removeNetwork(conf.networkId);
                wifi.saveConfiguration();
                JSObject object = new JSObject();
                object.put("success", true);
                object.put("message", "plugin.wifieapconfigurator.success.network.removed");
                call.success(object);
                res = true;
            }
        }
        /*} else {
            wifi.removeNetworkSuggestions(new ArrayList<WifiNetworkSuggestion>());
            JSObject object = new JSObject();
            object.put("success", true);
            object.put("message", "plugin.wifieapconfigurator.success.network.removed");
            call.success(object);
            res = true;
        }*/

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
        //if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
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
        /*} else{
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.wifi.disabled");
            call.success(object);
        }*/
    }

    @PluginMethod
    public boolean isNetworkAssociated(PluginCall call) {
        String ssid = null;
        boolean res = false, isOverridable = false;

        //if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
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
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\"" + ssid.toLowerCase() + "\"")) {

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
        /*} else{
            JSObject object = new JSObject();
            object.put("success", false);
            object.put("message", "plugin.wifieapconfigurator.error.ssid.missing");
            call.success(object);
        }*/

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

        boolean granted = getPermission(Manifest.permission.ACCESS_FINE_LOCATION);

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
                if (s.SSID.toLowerCase().equals(ssid.toLowerCase()) || s.SSID.toLowerCase().equals("\"" + ssid.toLowerCase() + "\"")) {
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

        boolean granted = getPermission(Manifest.permission.ACCESS_FINE_LOCATION);

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

        //if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        List<WifiConfiguration> configuredNetworks = wifi.getConfiguredNetworks();

        for (WifiConfiguration conf : configuredNetworks) {
            if (conf.SSID.toLowerCase().equals(ssid.toLowerCase()) || conf.SSID.toLowerCase().equals("\"" + ssid.toLowerCase() + "\"")) {
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
        //}
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

    boolean getPermission(String permission) {
        boolean res = true;
        if (!(checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED)) {
            res = false;
            ActivityCompat.requestPermissions(getActivity(), new String[]{permission}, 123);
        }

        return res;
    }

    private Integer getEapType(Integer eap, PluginCall call) {
        Integer res = null;
        switch (eap) {
            case 1:
                res = 13;
                break;
            case 2:
                res = 21;
                break;
            case 0:
                res = 25;
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

    private String getAuthType(Integer auth, PluginCall call) {
        String res = null;
        switch (auth) {
            case 2:
                res = "AUTH_METHOD_MSCHAP";
                break;
            case 3:
                res = "MS-CHAP-V2";
                break;
            case 1:
                res = "AUTH_METHOD_PAP";
                break;
            default:
                JSObject object = new JSObject();
                object.put("success", false);
                object.put("message", "plugin.wifieapconfigurator.error.auth.invalid");
                call.success(object);
                res = "0";
                break;
        }
        return res;
    }

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

}
