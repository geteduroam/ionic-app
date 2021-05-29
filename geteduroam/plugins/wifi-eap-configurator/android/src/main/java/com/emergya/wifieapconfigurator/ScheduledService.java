package com.emergya.wifieapconfigurator;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSuggestion;
import android.os.Build;

import com.emergya.wifieapconfigurator.wifieapconfigurator.R;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.JobIntentService;
import androidx.core.app.NotificationCompat;
import androidx.core.app.TaskStackBuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * Its the class responsable of create the notification and send it
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
public class ScheduledService extends JobIntentService {

    public static final int JOB_ID = 2;

    public static void enqueueWorkSchedule(Context context, Intent work) {
        enqueueWork(context, ScheduledService.class, JOB_ID, work);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {
        if (intent.getBooleanExtra("expiration", false)) {
            int netId = intent.getIntExtra("netId", -1);
            String fqdn = intent.getStringExtra("fqdn");
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P || netId < 0) {
                List<WifiNetworkSuggestion> suggestionList = new ArrayList<>();
                wm.removeNetworkSuggestions(suggestionList);
            } else {
                try {
                    wm.removeNetwork(netId);
                } catch(Throwable e) { /* do nothing */ }
                if (!fqdn.equals("")) {
                    try {
                        wm.removePasspointConfiguration(fqdn);
                    } catch(Throwable e) { /* do nothing */ }
                }
            }
        } else {
            // First we create the channel of the notifications
            NotificationChannel channel1 = new NotificationChannel("channel1", "geteduroam", NotificationManager.IMPORTANCE_HIGH);
            channel1.setDescription("geteduroam App");

            NotificationManager manager = getApplicationContext().getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel1);

            // Create an Intent for the activity you want to start
            Intent resultIntent = new Intent(getApplicationContext(), NotificationActivity.class);
            // Create the TaskStackBuilder and add the intent, which inflates the back stack
            TaskStackBuilder stackBuilder = TaskStackBuilder.create(getApplicationContext());
            stackBuilder.addNextIntentWithParentStack(resultIntent);
            // Get the PendingIntent containing the entire back stack
            PendingIntent resultPendingIntent = stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT);

            // Create the notification
            NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(getApplicationContext(), "channel1");

            mBuilder.setSmallIcon(R.drawable.ic_notifications)
                    .setColor(0x005da9)
                    .setContentTitle(intent.getStringExtra("title"))
                    .setContentText(intent.getStringExtra("message"))
                    .setContentIntent(resultPendingIntent)
                    .setAutoCancel(true);

            manager.notify(123, mBuilder.build());
        }
    }
}
