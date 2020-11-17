package com.emergya.wifieapconfigurator;

import android.os.Build;

public class FactoryAndroid {

	public static Android getAndroid(int api) {
		if (api <= Build.VERSION_CODES.P) {
			return new AndroidP();
		} else {
			return new AndroidR();
		}
	}

}
