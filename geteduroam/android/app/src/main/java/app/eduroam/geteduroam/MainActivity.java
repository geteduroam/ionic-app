package app.eduroam.geteduroam;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.emergya.wifieapconfigurator.WifiEapConfigurator;
import com.emergya.wifieapconfigurator.NotificationActivity;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.byteowls.capacitor.oauth2.OAuth2ClientPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      // Ex: add(TotallyAwesomePlugin.class);
      add(WifiEapConfigurator.class);
      add(OAuth2ClientPlugin.class);
    }});
    // ATTENTION: This was auto-generated to handle app links.
    Intent appLinkIntent = getIntent();
    String appLinkAction = appLinkIntent.getAction();
    Uri appLinkData = appLinkIntent.getData();
  }
}
