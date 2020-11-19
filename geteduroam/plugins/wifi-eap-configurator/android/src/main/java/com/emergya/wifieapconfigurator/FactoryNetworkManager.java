package com.emergya.wifieapconfigurator;

import android.os.Build;

import com.getcapacitor.PluginCall;

/**
 * Its the class responsable of create the class NetworkManager and initialize the attributes of the Plugin
 */
public class FactoryNetworkManager {

	/**
	 * Creates and returns the class depending of the API of the device
	 * @param api
	 * @param call
	 * @return
	 */
	public static NetworkManager getInstance(int api, PluginCall call) {
		ProfileDetails profile = new ProfileDetails(call);
		if (api <= Build.VERSION_CODES.P) {
			return new NetworkManagerP(profile);
		} else {
			return new NetworkManagerR(profile);
		}
	}

}
