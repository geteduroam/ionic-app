package app.eduroam.geteduroam;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.emergya.wifieapconfigurator.WifiEapConfigurator;
import com.emergya.wifieapconfigurator.config.IntentConfigurator;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.byteowls.capacitor.oauth2.OAuth2ClientPlugin;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		registerPlugin(WifiEapConfigurator.class);
		registerPlugin(OAuth2ClientPlugin.class);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
			if (requestCode == IntentConfigurator.ADD_NETWORKS_REQUEST_CODE) {
				// TODO handle result
			}
		}
	}
}
