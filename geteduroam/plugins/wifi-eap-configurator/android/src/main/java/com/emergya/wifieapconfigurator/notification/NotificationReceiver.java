package com.emergya.wifieapconfigurator.notification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.RequiresApi;

/**
 * Its the class responsable of the init the service of the notifications
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
public class NotificationReceiver extends BroadcastReceiver {

	@Override
	public void onReceive(Context context, Intent intent) {

		if (intent.getBooleanExtra("expiration", false) == true) {
			ScheduledService.enqueueWorkSchedule(context, new Intent().putExtra("expiration", true).putExtra("netId", intent.getIntExtra("netId", -1)).putExtra("fqdn", intent.getStringExtra("fqdn")));
		} else {
			ScheduledService.enqueueWorkSchedule(context, new Intent().putExtra("title", intent.getStringExtra("title")).putExtra("message", intent.getStringExtra("message")));
		}
	}
}
