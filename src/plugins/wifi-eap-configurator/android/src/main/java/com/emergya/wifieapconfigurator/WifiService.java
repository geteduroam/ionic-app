package com.emergya.wifieapconfigurator;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Network;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;

public class WifiService extends Service {
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        Toast.makeText(getApplicationContext(), "WifiService!!", Toast.LENGTH_LONG).show();
        Log.d("WifiService", "onStartCommand");

/*
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Network network = intent.getParcelableExtra("EXTRA_NETWORK");

            ConnectivityManager manager = (ConnectivityManager) getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            manager.bindProcessToNetwork(network);
        }
*/

        return super.onStartCommand(intent, flags, startId);
    }
}
