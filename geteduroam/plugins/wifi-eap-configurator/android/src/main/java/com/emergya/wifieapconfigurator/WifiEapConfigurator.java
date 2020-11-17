package com.emergya.wifieapconfigurator;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.FeatureInfo;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.media.RingtoneManager;
import android.net.wifi.ScanResult;
import android.net.wifi.hotspot2.ConfigParser;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.net.wifi.hotspot2.pps.HomeSp;
import android.net.wifi.hotspot2.pps.Credential;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSuggestion;
//import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;

import com.emergya.wifieapconfigurator.wifieapconfigurator.R;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import android.os.SystemClock;
import androidx.preference.PreferenceManager;

import android.provider.Settings;
import android.security.KeyChain;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
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
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.SecureRandom;
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
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.ArrayList;

import android.content.BroadcastReceiver;

import static androidx.core.content.PermissionChecker.checkSelfPermission;

@NativePlugin(
        permissions = {
                Manifest.permission.ACCESS_WIFI_STATE,
                Manifest.permission.CHANGE_WIFI_STATE,
                Manifest.permission.ACCESS_FINE_LOCATION
        })
public class WifiEapConfigurator extends Plugin {

    List<ScanResult> results = null;

    private WifiManager wifiManager;

    @RequiresApi(api = Build.VERSION_CODES.Q)
    @PluginMethod()
    public void configureAP(PluginCall call) throws JSONException {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        List config = new ArrayList();
        List<JSObject> result = new ArrayList();
        config = android.configureAP(call, getContext());

        if (config != null) {
            String[] oids = (String[]) config.get(3);
            String[] ssids = (String[]) config.get(2);

            if (ssids.length > 0 || oids.length > 0) {
                for (String ssid : ssids) {
                    result = android.connectNetwork(getContext(), ssid, (WifiEnterpriseConfig) config.get(0), call, (PasspointConfiguration) config.get(1), (String) config.get(4), (String) config.get(5), getActivity());
                    for (JSObject res: result) {
                        if (res.getBool("success")) {
                            call.success(res);
                        }
                    }
                }
            }
        }
        call.success(result.get(0));
    }

    @PluginMethod
    public void validatePassPhrase(PluginCall call) throws KeyStoreException, CertificateException, NoSuchAlgorithmException, IOException {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.validatePassPhrase(call);
    }

    @PluginMethod
    public void removeNetwork(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.removeNetwork(getContext(), call);
    }

    @PluginMethod
    public void enableWifi(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.enableWifi(getContext(), call);
    }

    @PluginMethod
    public boolean isNetworkAssociated(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        return android.isNetworkAssociated(getContext(), call);
    }

    @PluginMethod
    public void reachableSSID(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.reachableSSID(getContext(), getActivity(), call);
    }

    @PluginMethod
    public void isConnectedSSID(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.isConnectedSSID(getContext(), getActivity(), call);
    }

    @PluginMethod
    public boolean checkEnabledWifi(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        return android.checkEnabledWifi(getContext(), call);
    }

    @PluginMethod
    public void sendNotification(PluginCall call) throws JSONException {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.sendNotification(getContext(), call);
    }

    @PluginMethod()
    public void writeToSharedPref(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.writeToSharedPref(getContext(), call);
    }

    @PluginMethod()
    public void readFromSharedPref(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.readFromSharedPref(getContext(), call);
    }

    @PluginMethod()
    public void checkIfOpenThroughNotifications(PluginCall call) {
        Android android = FactoryAndroid.getAndroid(Build.VERSION.SDK_INT);
        android.checkIfOpenThroughNotifications(getActivity(), call);
    }
}
