package com.emergya.wifieapconfigurator;

import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiEnterpriseConfig;
import android.net.wifi.WifiNetworkSpecifier;
import android.net.wifi.WifiNetworkSuggestion;
import android.net.wifi.hotspot2.PasspointConfiguration;
import android.net.wifi.hotspot2.pps.Credential;
import android.net.wifi.hotspot2.pps.HomeSp;
import android.os.Build;
import android.util.Base64;

import androidx.annotation.RequiresApi;

import com.getcapacitor.PluginCall;

import org.json.JSONException;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.Certificate;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;

public class ProfileDetails {

	private final String[] ssids;
	private final String[] oids;
	private final String clientCertificate;
	private final String passPhrase;
	private final String anonymousIdentity;
	private final String[] caCertificate;
	private final int eap;
	private final String[] serverName;
	private final String username;
	private final String password;
	private final int auth;
	private final String id;

	/**
	 * Initializes all attributtes that come from ionic
	 * @param call Wi-Fi profile from ionic
	 * @throws WifiEapConfiguratorException The profile has issues that were detected before attempting a connect
	 */
	public ProfileDetails(PluginCall call) throws WifiEapConfiguratorException {
		try {
			this.ssids = objectArrayToStringArray(call.getArray("ssid").toList().toArray());
			this.oids = objectArrayToStringArray(call.getArray("oid").toList().toArray());
			this.caCertificate = objectArrayToStringArray(call.getArray("caCertificate").toList().toArray());
			this.serverName = objectArrayToStringArray(call.getArray("servername").toList().toArray());
			this.clientCertificate = call.getString("clientCertificate");
			this.passPhrase = call.getString("passPhrase");
			this.anonymousIdentity = call.getString("anonymous");
			this.eap = getEapMethod(call.getInt("eap"));
			this.id = call.getString("id");
			this.username = call.getString("username");
			this.password = call.getString("password");
			this.auth = getAuthMethod(call.getInt("auth"));
		} catch (JSONException | ArrayStoreException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.json", e);
		}

		if (this.ssids.length == 0 && this.oids.length == 0)
			// TODO also check for empty ssids?
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ssid.missing");
		if (this.eap <= 0)
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.eap.invalid");
		if (this.eap != WifiEnterpriseConfig.Eap.TLS) {
			// We need a username/password
			if (this.username == null)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.username.missing");
			if (this.password == null)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.password.missing");
			if (this.auth <= 0)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.auth.invalid");
		}
		if (this.serverName.length == 0) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ca.missing");
		}
	}

	private static String[] objectArrayToStringArray(Object... array) {
		return Arrays.copyOf(array, array.length, String[].class);
	}

	/**
	 * Returns the type of the EAP
	 * @param eap EAP type as used in eap-config
	 * @return A value from WifiEnterpriseConfig.Eap (TLS,TTLS,PEAP) or -1
	 */
	private static int getEapMethod(Integer eap) {
		if (eap == null) return -1;
		switch (eap) {
			case 13: return WifiEnterpriseConfig.Eap.TLS;
			case 21: return WifiEnterpriseConfig.Eap.TTLS;
			case 25: return WifiEnterpriseConfig.Eap.PEAP;
			default: return -1;
		}
	}

	/**
	 * Returns the type of the auth method
	 * @param auth Auth method as used in eap-config
	 * @return ENUM from WifiEnterpriseConfig.Phase2 (PAP/MSCHAP/MSCHAPv2) or -1
	 */
	private static int getAuthMethod(Integer auth) {
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
			case _: // TODO Not supported by the eap-config format, so no CAT auth type maps to GTC
				return WifiEnterpriseConfig.Phase2.GTC;
			*/
			default: return -1;
		}
	}

	@RequiresApi(api = Build.VERSION_CODES.Q)
	public ArrayList<WifiNetworkSuggestion> makeSuggestions() throws WifiEapConfiguratorException {
		ArrayList<WifiNetworkSuggestion> result = makeSSIDSuggestions();

		if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
			WifiNetworkSuggestion.Builder builder = makePasspointSuggestionBuilder();
			if (builder != null)
				result.add(builder.build());
		}

		return result;
	}

	@RequiresApi(api = Build.VERSION_CODES.Q)
	public ArrayList<WifiNetworkSuggestion> makeSSIDSuggestions() throws WifiEapConfiguratorException {
		ArrayList<WifiNetworkSuggestion> suggestions = new ArrayList<>();

		WifiEnterpriseConfig enterpriseConfig = createEnterpriseConfig();

		// SSID configuration
		for (String ssid : ssids) {
			WifiNetworkSuggestion suggestion = new WifiNetworkSuggestion.Builder()
					.setSsid(ssid)
					.setWpa2EnterpriseConfig(enterpriseConfig)
					.setIsAppInteractionRequired(true)
					.build();

			suggestions.add(suggestion);
		}

		return suggestions;
	}

	@RequiresApi(api = Build.VERSION_CODES.R)
	public WifiNetworkSuggestion.Builder makePasspointSuggestionBuilder() throws WifiEapConfiguratorException {
		PasspointConfiguration passpointConfig = createPasspointConfig();

		if (passpointConfig != null) {
			WifiNetworkSuggestion.Builder suggestionBuilder = new WifiNetworkSuggestion.Builder();
			suggestionBuilder.setPasspointConfig(passpointConfig);
			return suggestionBuilder;
		}

		return null;
	}

	/**
	 * Returns array of SSIDs
	 * @return All SSIDs
	 */
	public String[] getSsids(){
		return this.ssids;
	}

	/**
	 * Return the configuration of SSID and the configuration of the passpoint to configure it
	 * @return Enterprise configuration for this profile
	 */
	public final WifiEnterpriseConfig createEnterpriseConfig() throws WifiEapConfiguratorException {

		WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

		enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
		enterpriseConfig.setEapMethod(eap);
		enterpriseConfig.setCaCertificates(getCaCertificates().toArray(new X509Certificate[0]));

		assert(serverName.length != 0); // Checked in ProfileDetails constructor
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			enterpriseConfig.setDomainSuffixMatch(String.join(";", serverName));
		} else {
			enterpriseConfig.setDomainSuffixMatch(getLongestSuffix(serverName));
		}

		Map.Entry<PrivateKey,X509Certificate[]> clientCertificate = getClientCertificate();

		// Explicitly reset client certificate, will set later if needed
		enterpriseConfig.setClientKeyEntry(null, null);

		switch(eap) {
			case WifiEnterpriseConfig.Eap.TLS:
				// Explicitly unset unused fields
				enterpriseConfig.setPassword("");
				enterpriseConfig.setPhase2Method(WifiEnterpriseConfig.Phase2.NONE);
				enterpriseConfig.setClientKeyEntry(clientCertificate.getKey(), clientCertificate.getValue()[0]);

				// For TLS, "identity" is used for outer identity,
				// while for PEAP/TTLS, "identity" is the inner identity,
				// and anonymousIdentity is the outer identity
				// - so we have to do some weird shuffling here.
				enterpriseConfig.setIdentity(anonymousIdentity);

				break;

			case WifiEnterpriseConfig.Eap.PEAP:
			case WifiEnterpriseConfig.Eap.TTLS:
			case WifiEnterpriseConfig.Eap.PWD:
				enterpriseConfig.setIdentity(username);
				enterpriseConfig.setPassword(password);

				enterpriseConfig.setPhase2Method(auth);

				break;

			default:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.unknown.eapmethod." + eap);
		}

		return enterpriseConfig;
	}

	protected final Map.Entry<PrivateKey, X509Certificate[]> getClientCertificate() throws WifiEapConfiguratorException {
		try {
			byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
			char[] passphrase = passPhrase == null ? new char[0] : passPhrase.toCharArray();

			KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

			ByteArrayInputStream b = new ByteArrayInputStream(bytes);
			InputStream in = new BufferedInputStream(b);
			pkcs12ks.load(in, passphrase);

			Enumeration<String> aliases = pkcs12ks.aliases();

			while (aliases.hasMoreElements()) {
				String alias = aliases.nextElement();
				Certificate[] chain = pkcs12ks.getCertificateChain(alias);
				if (chain != null && chain.length > 0) try {
					return new AbstractMap.SimpleEntry<>(
							(PrivateKey) pkcs12ks.getKey(alias, passphrase),
							Arrays.copyOf(chain, chain.length, X509Certificate[].class)
					);
				} catch (ArrayStoreException e) { /* try next entry */ }
			}
		} catch (KeyStoreException | NoSuchAlgorithmException | UnrecoverableKeyException | CertificateException | IOException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.clientCertificate.invalid - " + e.getMessage(), e);
		}
		throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.clientCertificate.empty");
	}

	protected final Collection<X509Certificate> getCaCertificates() throws WifiEapConfiguratorException {
		CertificateFactory certFactory;
		List<X509Certificate> certificates = new ArrayList<>(caCertificate.length);
		// building the certificates
		for (String certString : caCertificate) {
			byte[] bytes = Base64.decode(certString, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);

			try {
				certFactory = CertificateFactory.getInstance("X.509");
				X509Certificate certificate = (X509Certificate) certFactory.generateCertificate(b);
				boolean[] usage = certificate.getKeyUsage();
				// https://docs.oracle.com/javase/7/docs/api/java/security/cert/X509Certificate.html#getKeyUsage()
				// 5 is KeyUsage keyCertSign, which indicates the certificate is a CA
				if (usage != null && usage[5]) {
					// Find out if this a CA according to KeyUsage
					certificates.add(certificate);
				} else {
					// Find out if this a CA according to Basic Constraints
					byte[] extension = certificate.getExtensionValue("2.5.29.19");
					if (extension != null && extension.length > 1 && extension[0] != 0) {
						certificates.add(certificate);
					}
				}
				// We really shouldn't expect any certificate here to NOT be a CA,
				// CAT shows a nice red warning when you try to configure this,
				// but experience shows that sometimes this is not enough of a deterrent.
				// We may very well block profiles like this, but then it should be done BEFORE
				// the user enters their username/password, not after.
			} catch (CertificateException | IllegalArgumentException e) {
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ca.invalid", e);
			}
		}

		return certificates;
	}

	/**
	 * Return if the passphrase received through the plugin is correct
	 * @throws WifiEapConfiguratorException An error occurred during passphrase validation (other than wrong passphrase)
	 */
	public final boolean validatePassPhrase() throws WifiEapConfiguratorException {
		if (clientCertificate == null || passPhrase == null) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passphrase.validation");
		}

		try {
			KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

			byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);
			InputStream in = new BufferedInputStream(b);

			pkcs12ks.load(in, passPhrase.toCharArray());
		} catch (CertificateException e) {
			return false;
		} catch (IOException | NoSuchAlgorithmException | KeyStoreException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passphrase.validation", e);
		}
		return true;
	}

	/**
	 * Create the configuration necessary to configure a passpoint and returns it
	 * @return Passpoint configuration for this profile
	 */
	public final PasspointConfiguration createPasspointConfig() throws WifiEapConfiguratorException {
		PasspointConfiguration passpointConfig = new PasspointConfiguration();

		HomeSp homeSp = new HomeSp();
		homeSp.setFqdn(id);

		homeSp.setFriendlyName(id + " via Passpoint");

		long[] roamingConsortiumOIDs = new long[oids.length];
		int index = 0;
		for (String roamingConsortiumOIDString : oids) {
			if (!roamingConsortiumOIDString.startsWith("0x")) {
				roamingConsortiumOIDString = "0x" + roamingConsortiumOIDString;
			}
			roamingConsortiumOIDs[index] = Long.decode(roamingConsortiumOIDString);
			index++;
		}
		if (index == 0) return null;
		homeSp.setRoamingConsortiumOis(roamingConsortiumOIDs);

		passpointConfig.setHomeSp(homeSp);
		Credential cred = new Credential();
		cred.setRealm(id);
		//cred.setCaCertificate(enterpriseConfig.getCaCertificate()); // TODO needed?

		switch(eap) {
			case WifiEnterpriseConfig.Eap.TLS:
				Credential.CertificateCredential certCred = new Credential.CertificateCredential();
				certCred.setCertType("x509v3");
				Map.Entry<PrivateKey,X509Certificate[]> clientCertificate = getClientCertificate();
				cred.setClientPrivateKey(clientCertificate.getKey());
				cred.setClientCertificateChain(clientCertificate.getValue());
				certCred.setCertSha256Fingerprint(getFingerprint(clientCertificate.getValue()[0]));
				cred.setCertCredential(certCred);
				break;
			case WifiEnterpriseConfig.Eap.PEAP:
			case WifiEnterpriseConfig.Eap.TTLS:
			case WifiEnterpriseConfig.Eap.PWD:
				byte[] passwordBytes = password.getBytes(Charset.defaultCharset()); // TODO explicitly use UTF-8?
				String base64 = Base64.encodeToString(passwordBytes, Base64.DEFAULT);

				Credential.UserCredential us = new Credential.UserCredential();
				us.setUsername(anonymousIdentity);
				us.setPassword(base64);
				us.setEapType(21);
				switch(auth) {
					// Strings from android.net.wifi.hotspot2.pps.Credential.UserCredential.AUTH_METHOD_*
					case WifiEnterpriseConfig.Phase2.MSCHAPV2:
						us.setNonEapInnerMethod("MS-CHAP-V2");
						break;
					case WifiEnterpriseConfig.Phase2.PAP:
						us.setNonEapInnerMethod("PAP");
						break;
					case WifiEnterpriseConfig.Phase2.MSCHAP:
						us.setNonEapInnerMethod("MS-CHAP");
						break;
					// TODO Do we need a default case here?
				}

				cred.setUserCredential(us);
				break;
			default:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.unknown.eapmethod." + eap);
		}

		passpointConfig.setCredential(cred);

		return passpointConfig;
	}

	@RequiresApi(api = Build.VERSION_CODES.Q)
	public ArrayList<NetworkRequest> createNetworkRequests() throws WifiEapConfiguratorException {
		WifiEnterpriseConfig enterpriseConfig = createEnterpriseConfig();
		ArrayList<NetworkRequest> result = new ArrayList<>(ssids.length);
		for(String ssid: ssids) {
			WifiNetworkSpecifier.Builder builder = new WifiNetworkSpecifier.Builder();
			builder.setSsid(ssid);
			builder.setWpa2EnterpriseConfig(enterpriseConfig);
			WifiNetworkSpecifier wifiNetworkSpecifier = builder.build();
			NetworkRequest.Builder networkRequestBuilder = new NetworkRequest.Builder();
			networkRequestBuilder.addTransportType(NetworkCapabilities.TRANSPORT_WIFI);
			networkRequestBuilder.setNetworkSpecifier(wifiNetworkSpecifier);
			result.add(networkRequestBuilder.build());
		}
		return result;
	}

	/**
	 *
	 * @param strings A list of host names
	 * @return The longest common suffix for all given host names
	 */
	static String getLongestSuffix(String[] strings) {
		if (strings.length == 0) return "";
		if (strings.length == 1) return strings[0];
		String longest = strings[0];
		for(String candidate : strings) {
			int pos = candidate.length();
			do {
				pos = candidate.lastIndexOf('.', pos - 2) + 1;
			} while (pos > 0 && longest.endsWith(candidate.substring(pos)));
			if (!longest.endsWith(candidate.substring(pos))) {
				pos = candidate.indexOf('.', pos);
			}
			if (pos == -1) {
				longest = "";
			} else if (longest.endsWith(candidate.substring(pos))) {
				longest = candidate.substring(pos == 0 ? 0 : pos + 1);
			}
		}
		return longest;
	}

	/**
	 * Returns fingerprint of the certificate
	 * @param certificate The certificate to inspect
	 * @return The fingerprint of the certificate
	 */
	private static byte[] getFingerprint(X509Certificate certificate) {
		byte[] fingerprint = null;
		try {
			MessageDigest digester = MessageDigest.getInstance("SHA-256");
			digester.reset();
			fingerprint = digester.digest(certificate.getEncoded());
		} catch (NoSuchAlgorithmException | CertificateEncodingException e) {
			e.printStackTrace();
		}
		return fingerprint;
	}

}
