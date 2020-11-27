package com.emergya.wifieapconfigurator;

import android.net.wifi.WifiEnterpriseConfig;

import com.getcapacitor.PluginCall;

import org.json.JSONException;

import java.util.List;

public class ProfileDetails {

    private String[] ssids;
    private String ssid;
    private String[] oids;
    private String clientCertificate;
    private String passPhrase;
    private String anonymousIdentity;
    private String[] caCertificate;
    private Integer eap;
    private String[] servername;
    private String username;
    private String password;
    private Integer auth;
    private String id;
    private String displayName;
    private String stringDate;
    private String title;
    private String message;
    private String institutionId;
    private String authentication;
    private String logo;
    private String suffix;
    private String institution;
    private String institutionName;
    private String webAddress;
    private String emailAddress;
    private String phone;
    private String oid;

    /**
     * Initializes all attributtes that come from ionic
     * @param call
     */
    public ProfileDetails(PluginCall call) {
        try {
            List aux = call.getArray("ssid").toList();
            this.ssids = new String[aux.size()];
            for (int i = 0 ; i < aux.size() ; i++) {
                this.ssids[i] = aux.get(i).toString();
            }
            aux = call.getArray("oid").toList();
            this.oids = new String[aux.size()];
            for (int i = 0 ; i < aux.size() ; i++) {
                this.oids[i] = aux.get(i).toString();
            }
            aux = call.getArray("caCertificate").toList();
            this.caCertificate = new String[aux.size()];
            for (int i = 0 ; i < aux.size() ; i++) {
                this.caCertificate[i] = aux.get(i).toString();
            }
            aux = call.getArray("servername").toList();
            this.servername = new String[aux.size()];
            for (int i = 0 ; i < aux.size() ; i++) {
                this.servername[i] = aux.get(i).toString();
            }
        } catch (Exception e) {
            System.out.println("Load parameters from call did fail: " + e);
        }
        this.clientCertificate = call.getString("clientCertificate");
        this.passPhrase = call.getString("passPhrase");
        this.anonymousIdentity = call.getString("anonymous");
        try {
            this.eap = getEapMethod(call.getInt("eap"));
        } catch (Exception e) {}
        this.id = call.getString("id");
        this.displayName = call.getString("displayName");
        this.username = call.getString("username");
        this.password = call.getString("password");
        try {
            this.auth = getAuthMethod(call.getInt("auth"));
        } catch (Exception e) {}
        this.stringDate = call.getString("date");
        this.title = call.getString("title");
        this.message = call.getString("message");
        this.institutionId = call.getString("id");
        this.ssid = call.getString("ssid");
        this.authentication = call.getString("authentication");
        this.logo = call.getString("logo");
        this.suffix = call.getString("suffix");
        this.institution = call.getString("institution");
        this.institutionName = call.getString("institutionName");
        this.webAddress = call.getString("webAddress");
        this.emailAddress = call.getString("emailAddress");
        this.phone = call.getString("phone");
        this.oid = call.getString("oid");
    }

    /**
     * Returns the type of the EAP
     * @param eap
     * @return
     */
    private Integer getEapMethod(Integer eap) {
        switch (eap) {
            case 13: return WifiEnterpriseConfig.Eap.TLS;
            case 21: return WifiEnterpriseConfig.Eap.TTLS;
            case 25: return WifiEnterpriseConfig.Eap.PEAP;
            default: return null;
        }
    }

    /**
     * Returns the type of the auth method
     * @param auth
     * @return
     */
    private Integer getAuthMethod(Integer auth) {
        if (auth == null) {
            return WifiEnterpriseConfig.Phase2.MSCHAPV2;
        }
        switch (auth) {
            case -1: return WifiEnterpriseConfig.Phase2.PAP;
            case -2: return WifiEnterpriseConfig.Phase2.MSCHAP;
            case -3:
            case 26: /* Android cannot do TTLS-EAP-MSCHAPv2, we expect the ionic code to not let it happen, but if it does, try TTLS-MSCHAPv2 instead */
                // This currently DOES happen because CAT has a bug where it reports TTLS-MSCHAPv2 as TTLS-EAP-MSCHAPv2,
                // so denying this would prevent profiles from being sideloaded
                return WifiEnterpriseConfig.Phase2.MSCHAPV2;
            /*
            case _:
                return WifiEnterpriseConfig.Phase2.GTC;
            */
            default: return null;
        }
    }

    /**
     * Returns array of SSID
     * @return
     */
    public String[] getSsids(){
        return this.ssids;
    }

    /**
     * Returns array of OIDS
     * @return
     */
    public String[] getOids() {
        return oids;
    }

    /**
     * Returns the client certificate
     * @return
     */
    public String getClientCertificate() {
        return clientCertificate;
    }

    /**
     * Returns the passphrase
     * @return
     */
    public String getPassPhrase() {
        return passPhrase;
    }

    /**
     * Returns the anonymous identity
     * @return
     */
    public String getAnonymousIdentity() {
        return anonymousIdentity;
    }

    /**
     * Returns the array of CaCertificate
     * @return
     */
    public String[] getCaCertificates() {
        return caCertificate;
    }

    /**
     * Returns the eap
     * @return
     */
    public Integer getEap() {
        return eap;
    }

    /**
     * Returns the array of servernames
     * @return
     */
    public String[] getServernames() {
        return servername;
    }

    /**
     * Return the username
     * @return
     */
    public String getUsername() {
        return username;
    }

    /**
     * Returns the password
     * @return
     */
    public String getPassword() {
        return password;
    }

    /**
     * Returns the auth
     * @return
     */
    public Integer getAuth() {
        return auth;
    }

    /**
     * Returns the id
     * @return
     */
    public String getId() {
        return id;
    }

    /**
     * Returns the Display Name
     * @return
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Returns the date of notification
     * @return
     */
    public String getStringDate() {
        return stringDate;
    }

    /**
     * Returns the title of the notification
     * @return
     */
    public String getTitle() {
        return title;
    }

    /**
     * Returns the message of the notification
     * @return
     */
    public String getMessage() {
        return message;
    }

    /**
     * Returns the id of the institution
     * @return
     */
    public String getInstitutionId() {
        return institutionId;
    }

    /**
     * Returns an unique SSID
     * @return
     */
    public String getSsid() {
        return ssid;
    }

    /**
     * Returns the authentication type
     * @return
     */
    public String getAuthentication() {
        return authentication;
    }

    /**
     * Returns the url of the logo
     * @return
     */
    public String getLogo() {
        return logo;
    }

    /**
     * Returns the suffix of the institution
     * @return
     */
    public String getSuffix() {
        return suffix;
    }

    /**
     * Returns the name of the institution profile
     * @return
     */
    public String getInstitution() { return institution; }

    /**
     * Returns the name of the institution
     * @return
     */
    public String getInstitutionName() { return institutionName; }

    /**
     * Returns the web address
     * @return
     */
    public String getWebAddress() {
        return webAddress;
    }

    /**
     * Returns the email address
     * @return
     */
    public String getEmailAddress() {
        return emailAddress;
    }

    /**
     * Returns the phone number
     * @return
     */
    public String getPhone() {
        return phone;
    }

    /**
     * Returns the oids in string format
     * @return
     */
    public String getOid() { return oid; }
}
