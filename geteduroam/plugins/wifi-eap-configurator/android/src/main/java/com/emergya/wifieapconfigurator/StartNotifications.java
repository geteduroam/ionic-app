package com.emergya.wifieapconfigurator;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.core.app.JobIntentService;
import androidx.preference.PreferenceManager;

import com.getcapacitor.JSObject;

import java.util.Date;

public class StartNotifications extends JobIntentService {

    public static final int JOB_ID = 1;

    public static void enqueueWorkStart(Context context, Intent work) {
        enqueueWork(context, StartNotifications.class, JOB_ID, work);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {

        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

        if (sharedPref.getString("date", "") != "") {
            String stringDate = sharedPref.getString("date", "");
            String title = sharedPref.getString("title", "");
            String message = sharedPref.getString("message", "");


            Long dateUntil = Long.parseLong(stringDate);
            Date dateNow = new Date();
            Long millisNow = dateNow.getTime();
            Long delay = dateUntil - millisNow - 432000000;
            if ( delay.compareTo(Long.valueOf(0)) > 0 ) {
                AlarmManager mgr = (AlarmManager) getApplicationContext().getSystemService(Context.ALARM_SERVICE);
                Intent i = new Intent(getApplicationContext(), NotificationReceiver.class);
                i.putExtra("title", title);
                i.putExtra("message", message);
                PendingIntent pi = PendingIntent.getBroadcast(getApplicationContext(), 0, i, 0);

                mgr.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + delay, pi);
            }
        }
    }
}
