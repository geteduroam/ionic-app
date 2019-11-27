package com.emergya.wifieapconfigurator;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@NativePlugin()
public class WifiEapConfigurator extends Plugin {

    @PluginMethod()
    public void test(PluginCall call) {
        String value = call.getString("ssid");
        Log.i("parametros",value);
        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }
}
