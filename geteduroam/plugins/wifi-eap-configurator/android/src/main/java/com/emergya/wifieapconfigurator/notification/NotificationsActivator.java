package com.emergya.wifieapconfigurator.notification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * It's the class responsible of reactivate the alarm when the device is rebooted
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
