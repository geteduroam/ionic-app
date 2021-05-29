package com.emergya.wifieapconfigurator;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Its the class responsable of reactive the alarm when the device is rebooted
 */
public class NotificationsActivator extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED")) {
            StartNotifications.enqueueWorkStart(context, new Intent());
        }
        if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED")) {
            StartNotifications.enqueueWorkStart(context, new Intent().putExtra("expiration", true));
        }
    }
}
