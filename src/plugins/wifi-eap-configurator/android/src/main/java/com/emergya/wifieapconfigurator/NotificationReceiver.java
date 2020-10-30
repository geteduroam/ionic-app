package com.emergya.wifieapconfigurator;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class NotificationReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        Log.e("Exception", "Estoy en notificationReceiver");
        //Intent i = new Intent(context, ScheduledService.class);
        //context.startService(i);
        ScheduledService.enqueueWork(context, new Intent());
    }
}