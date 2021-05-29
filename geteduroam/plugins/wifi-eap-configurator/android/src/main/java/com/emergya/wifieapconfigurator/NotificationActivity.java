package com.emergya.wifieapconfigurator;

import android.os.Bundle;

import com.byteowls.capacitor.oauth2.OAuth2ClientPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

/**
 * Its the class secondary responsable of init the app flow when the app is opened through a notification
 */
public class NotificationActivity extends BridgeActivity {

    public static String NOTIFICATION_ID = "1523";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            // Additional plugins you've installed go here
            // Ex: add(TotallyAwesomePlugin.class);
            add(WifiEapConfigurator.class);
            add(OAuth2ClientPlugin.class);
        }});
    }
}
