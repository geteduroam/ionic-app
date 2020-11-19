package com.emergya.wifieapconfigurator;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Its the class responsable of the init the service of the notifications
 */
public class NotificationReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        ScheduledService.enqueueWorkSchedule(context, new Intent().putExtra("title", intent.getStringExtra("title")).putExtra("message", intent.getStringExtra("message")));
    }
}