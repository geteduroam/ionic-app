package com.emergya.wifieapconfigurator;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class NotificationReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        if (intent.getBooleanExtra("expiration", false) == true) {
            ScheduledService.enqueueWorkSchedule(context, new Intent().putExtra("expiration", true).putExtra("netId", intent.getIntExtra("netId", -1)));
        } else {
            ScheduledService.enqueueWorkSchedule(context, new Intent().putExtra("title", intent.getStringExtra("title")).putExtra("message", intent.getStringExtra("message")));
        }
    }
}