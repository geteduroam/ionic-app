package com.emergya.wifieapconfigurator.notification;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.core.app.JobIntentService;
import androidx.preference.PreferenceManager;

import java.util.Date;

public class StartRemoveNetwork extends JobIntentService {

	public static final int JOB_ID = 3;

	public static void enqueueWorkStart(Context context, Intent work) {
		enqueueWork(context, StartRemoveNetwork.class, JOB_ID, work);
	}

	@Override
	protected void onHandleWork(@NonNull Intent intent) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

		String date = sharedPref.getString("date", "");
		int netId = sharedPref.getInt("netId", -1);
		String fqdn = sharedPref.getString("fqdn", "");
		long dateUntil = Long.parseLong(date);
		Date dateNow = new Date();
		long millisNow = dateNow.getTime();
		long delay = dateUntil - millisNow;
		if (delay > 0L) {
			AlarmManager mgr = (AlarmManager) getApplicationContext().getSystemService(Context.ALARM_SERVICE);
			Intent i = new Intent(getApplicationContext(), NotificationReceiver.class);
			i.putExtra("expiration", true);
			i.putExtra("netId", netId);
			i.putExtra("fqdn", fqdn);
			PendingIntent pi = PendingIntent.getBroadcast(getApplicationContext(), 1, i, 0);
			mgr.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + delay, pi);
		}
	}

}
