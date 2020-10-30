package com.emergya.wifieapconfigurator;

import android.app.Activity;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;


public class NotificationActivity extends BridgeActivity {

    public static String NOTIFICATION_ID = "1523";
    public static String NOTIFICATION = "notification";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            // Additional plugins you've installed go here
            // Ex: add(TotallyAwesomePlugin.class);
            add(WifiEapConfigurator.class);
        }});
        WifiEapConfigurator wifiEap = new WifiEapConfigurator();
        wifiEap.setOpenFromNotification();
    }
}
