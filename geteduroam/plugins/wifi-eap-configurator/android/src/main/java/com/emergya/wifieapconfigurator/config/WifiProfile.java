package com.emergya.wifieapconfigurator.config;

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
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.emergya.wifieapconfigurator.WifiEapConfiguratorException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.security.GeneralSecurityException;
import java.security.InvalidAlgorithmParameterException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.CertPathValidatorException;
import java.security.cert.Certificate;
import java.security.cert.CertificateEncodingException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.X509Certificate;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;

public class WifiProfile {

	private final String[] ssids;
	private final String[] oids;
	private final Map.Entry<PrivateKey, X509Certificate[]> clientCertificate;
	private final String anonymousIdentity;
	private final List<X509Certificate> caCertificates;
	private final int enterpriseEAP;
	private final String[] serverNames;
	private final String username;
	private final String password;
	private final int enterprisePhase2Auth;
	private final String fqdn;

	/**
	 * Initializes all attributtes that come from ionic
	 *
	 * @param object Wi-Fi profile from ionic
	 * @throws WifiEapConfiguratorException The profile has issues that were detected before attempting a connect
	 */
	public WifiProfile(JSONObject object) throws WifiEapConfiguratorException {
		try {
			// Required fields
			this.ssids = jsonArrayToStringArray(object.getJSONArray("ssid"));
			this.serverNames = jsonArrayToStringArray(object.getJSONArray("servername"));
			this.enterpriseEAP = getEapMethod(object.getInt("eap"));
			this.fqdn = object.getString("id");
			this.caCertificates = getCaCertificates(jsonArrayToStringArray(object.getJSONArray("caCertificate")));

			// Client certificate, optional, but passphrase is required if used
			this.clientCertificate = object.has("clientCertificate")
				? getClientCertificate(object.getString("clientCertificate"), object.getString("passPhrase"))
				: null;

			// Optional fields
			this.oids = object.has("oid") ? jsonArrayToStringArray(object.getJSONArray("oid")) : new String[0];
			this.anonymousIdentity = object.has("anonymous") ? object.getString("anonymous") : null;
			this.username = object.has("username") ? object.getString("username") : null;
			this.password = object.has("password") ? object.getString("password") : null;
			this.enterprisePhase2Auth = object.has("auth") && !object.isNull("auth")
				? getAuthMethod(object.optInt("auth", 0))
				: -1;
		} catch (JSONException | ArrayStoreException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.json", e);
		}

		if (this.ssids.length == 0 && this.oids.length == 0)
			// TODO also check for empty ssids?
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ssid.missing");
		if (this.enterpriseEAP < 0)
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.eap.invalid");
		if (this.enterpriseEAP != WifiEnterpriseConfig.Eap.TLS) {
			// We need a username/password
			if (this.username == null)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.username.missing");
			if (this.password == null)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.password.missing");
			if (this.enterprisePhase2Auth <= 0)
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.auth.invalid");
		}
		if (this.serverNames.length == 0) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ca.missing");
		}
		try {
			for (X509Certificate caCert : caCertificates) {
				verifyCaCert(caCert);
			}
		} catch (CertPathValidatorException | InvalidAlgorithmParameterException e) {
			e.printStackTrace();
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.ca.invalid");
		} catch (IOException | GeneralSecurityException e) {
			e.printStackTrace();
			Log.e(getClass().getSimpleName(), "Error getting CA validator, this should never happen!");
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.internal");
		}
	}

	private static String[] jsonArrayToStringArray(JSONArray array) throws JSONException {
		String[] result = new String[array.length()];
		for (int i = 0; i < array.length(); i++)
			result[i] = array.getString(i);
		return result;
	}

	/**
	 * Returns the type of the EAP
	 *
	 * @param ianaEAPMethod EAP type as used in eap-config
	 * @return A value from WifiEnterpriseConfig.Eap (TLS,TTLS,PEAP) or -1
	 */
	private static int getEapMethod(int ianaEAPMethod) {
		switch (ianaEAPMethod) {
			case 13:
				return WifiEnterpriseConfig.Eap.TLS;
			case 21:
				return WifiEnterpriseConfig.Eap.TTLS;
			case 25:
				return WifiEnterpriseConfig.Eap.PEAP;
			default:
				return -1;
		}
	}

	/**
	 * Returns the type of the auth method
	 *
	 * @param catAuthMethod Auth method as used in eap-config
	 * @return ENUM from WifiEnterpriseConfig.Phase2 (PAP/MSCHAP/MSCHAPv2) or -1
	 */
	private static int getAuthMethod(int catAuthMethod) {
		switch (catAuthMethod) {
			case -1:
				return WifiEnterpriseConfig.Phase2.PAP;
			case -2:
				return WifiEnterpriseConfig.Phase2.MSCHAP;
			case -3:
			case 26: /* Android cannot do TTLS-EAP-MSCHAPv2, we expect the ionic code to not let it happen, but if it does, try TTLS-MSCHAPv2 instead */
				// This currently DOES happen because CAT has a bug where it reports TTLS-MSCHAPv2 as TTLS-EAP-MSCHAPv2,
				// so denying this would prevent profiles from being sideloaded
				return WifiEnterpriseConfig.Phase2.MSCHAPV2;
			/*
			case _: // TODO Not supported by the eap-config format, so no CAT auth type maps to GTC
				return WifiEnterpriseConfig.Phase2.GTC;
			*/
			default:
				return -1;
		}
	}

	/**
	 * @param strings A list of host names
	 * @return The longest common suffix for all given host names
	 */
	static String getLongestSuffix(String[] strings) {
		if (strings.length == 0) return "";
		if (strings.length == 1) return strings[0];
		String longest = strings[0];
		for (String candidate : strings) {
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
	 *
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

	/**
	 * Verify if the CaCertificate its valid for Android looking for in the AndroidCaStore
	 *
	 * @param caCert
	 * @throws CertPathValidatorException         {@code CertPath} does not validate
	 * @throws InvalidAlgorithmParameterException parameters or the type of the specified {@code CertPath} are inappropriate for this {@code CertPathValidator}
	 * @throws GeneralSecurityException           Should not happen; unable to get a validator
	 * @throws IOException                        Should not happen; unable to get a validator
	 */
	private static void verifyCaCert(X509Certificate caCert) throws CertPathValidatorException, InvalidAlgorithmParameterException, GeneralSecurityException, IOException {
		CertificateFactory factory = CertificateFactory.getInstance("X.509");
		CertPathValidator validator =
			CertPathValidator.getInstance(CertPathValidator.getDefaultType());
		CertPath path = factory.generateCertPath(Arrays.asList(caCert));
		KeyStore ks = KeyStore.getInstance("AndroidCAStore");
		ks.load(null, null);
		PKIXParameters params = new PKIXParameters(ks);
		params.setRevocationEnabled(false);
		validator.validate(path, params);
	}

	/**
	 * Return if the passphrase received through the plugin is correct
	 *
	 * @param clientCertificate The client certificate in a PKCS12 container
	 * @param passphrase        The passphrase
	 * @return The passphrase can decrypt the client certificate
	 * @throws WifiEapConfiguratorException An error occurred during passphrase validation, other than wrong passphrase, such as invalid client certificate
	 */
	public static boolean validatePassPhrase(String clientCertificate, String passphrase) throws WifiEapConfiguratorException {
		if (clientCertificate == null || passphrase == null) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passphrase.validation");
		}

		try {
			KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

			byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);
			InputStream in = new BufferedInputStream(b);

			pkcs12ks.load(in, passphrase.toCharArray());
		} catch (CertificateException e) {
			return false;
		} catch (IOException | NoSuchAlgorithmException | KeyStoreException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.passphrase.validation", e);
		}
		return true;
	}

	private static Map.Entry<PrivateKey, X509Certificate[]> getClientCertificate(String clientCertificate, String passphrase) throws WifiEapConfiguratorException {
		try {
			byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
			char[] passphraseBytes = passphrase == null ? new char[0] : passphrase.toCharArray();

			KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

			ByteArrayInputStream b = new ByteArrayInputStream(bytes);
			InputStream in = new BufferedInputStream(b);
			pkcs12ks.load(in, passphraseBytes);

			Enumeration<String> aliases = pkcs12ks.aliases();

			while (aliases.hasMoreElements()) {
				String alias = aliases.nextElement();
				Certificate[] chain = pkcs12ks.getCertificateChain(alias);
				if (chain != null && chain.length > 0) try {
					return new AbstractMap.SimpleEntry<>(
						(PrivateKey) pkcs12ks.getKey(alias, passphraseBytes),
						Arrays.copyOf(chain, chain.length, X509Certificate[].class)
					);
				} catch (ArrayStoreException e) { /* try next entry */ }
			}
		} catch (KeyStoreException | NoSuchAlgorithmException | UnrecoverableKeyException | CertificateException | IOException e) {
			throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.clientCertificate.invalid - " + e.getMessage(), e);
		}
		throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.clientCertificate.empty");
	}

	private static List<X509Certificate> getCaCertificates(String... caCertificates) throws WifiEapConfiguratorException {
		if (caCertificates.length == 0) {
			throw new IllegalArgumentException("Must provide at least 1 certificate, 0 provided");
		}

		CertificateFactory certFactory;
		List<X509Certificate> certificates = new ArrayList<>(caCertificates.length);
		// building the certificates
		for (String certString : caCertificates) {
			byte[] bytes = Base64.decode(certString, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);

			try {
				certFactory = CertificateFactory.getInstance("X.509");
				X509Certificate certificate = (X509Certificate) certFactory.generateCertificate(b);
				boolean[] usage = certificate.getKeyUsage();
				// https://docs.oracle.com/javase/7/docs/api/java/security/cert/X509Certificate.html#getKeyUsage()
				// 5 is KeyUsage keyCertSign, which indicates the certificate is a CA
				if (usage != null && usage.length > 5 && usage[5]) {
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
	 *
	 * @return All SSIDs
	 */
	public String[] getSsids() {
		return this.ssids;
	}

	/**
	 * Return the configuration of SSID and the configuration of the passpoint to configure it
	 *
	 * @return Enterprise configuration for this profile
	 */
	public final WifiEnterpriseConfig createEnterpriseConfig() throws WifiEapConfiguratorException {

		WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

		enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
		enterpriseConfig.setEapMethod(enterpriseEAP);
		enterpriseConfig.setCaCertificates(caCertificates.toArray(new X509Certificate[0]));

		assert (serverNames.length != 0); // Checked in WifiProfile constructor
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			enterpriseConfig.setDomainSuffixMatch(String.join(";", serverNames));
		} else {
			enterpriseConfig.setDomainSuffixMatch(getLongestSuffix(serverNames));
		}

		// Explicitly reset client certificate, will set later if needed
		enterpriseConfig.setClientKeyEntry(null, null);

		switch (enterpriseEAP) {
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

				enterpriseConfig.setPhase2Method(enterprisePhase2Auth);

				break;

			default:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.unknown.eapmethod." + enterpriseEAP);
		}

		return enterpriseConfig;
	}

	protected final List<X509Certificate> getLeafCaCertificates() throws WifiEapConfiguratorException {
		List<X509Certificate> leafCertificates = new ArrayList<>(caCertificates.size());

		c1:
		for (X509Certificate c1 : caCertificates) {
			for (X509Certificate c2 : caCertificates) {
				if (c1 == c2) continue;

				// If c2 has c1 as issuer, c1 is not a leaf
				if (c1.getSubjectDN().equals(c2.getIssuerDN())) continue c1; // try next c1
			}

			leafCertificates.add(c1);
		}

		return leafCertificates;
	}

	/**
	 * Create the configuration necessary to configure a passpoint and returns it
	 *
	 * @return Passpoint configuration for this profile
	 */
	public final PasspointConfiguration createPasspointConfig() throws WifiEapConfiguratorException {
		PasspointConfiguration passpointConfig = new PasspointConfiguration();

		HomeSp homeSp = new HomeSp();
		homeSp.setFqdn(fqdn);
		homeSp.setFriendlyName(fqdn + " via Passpoint");

		long[] roamingConsortiumOIDs = new long[oids.length];
		int index = 0;
		for (String roamingConsortiumOIDString : oids) {
			if (!roamingConsortiumOIDString.startsWith("0x")) {
				roamingConsortiumOIDString = "0x" + roamingConsortiumOIDString;
			}
			roamingConsortiumOIDs[index] = Long.decode(roamingConsortiumOIDString);
			index++;
		}
		if (index == 0) {
			Log.i(getClass().getSimpleName(), "Not creating Passpoint configuration due to no OIDs set");
			return null;
		}
		homeSp.setRoamingConsortiumOis(roamingConsortiumOIDs);

		passpointConfig.setHomeSp(homeSp);

		Credential cred = new Credential();
		List<X509Certificate> rootCertificates = getLeafCaCertificates();
		// TODO Add support for multiple CAs
		assert (rootCertificates.size() != 0);
		if (rootCertificates.size() != 1) {
			Log.e(getClass().getSimpleName(), "Passpoint configuration may not work due to too many CAs in the profile (1 supported, " + rootCertificates.size() + " given)");
		}
		cred.setCaCertificate(rootCertificates.get(0));
		// TODO Set server name check somehow
		cred.setRealm(fqdn);

		switch (enterpriseEAP) {
			case WifiEnterpriseConfig.Eap.TLS:
				Credential.CertificateCredential certCred = new Credential.CertificateCredential();
				certCred.setCertType("x509v3");
				cred.setClientPrivateKey(clientCertificate.getKey());
				cred.setClientCertificateChain(clientCertificate.getValue());
				certCred.setCertSha256Fingerprint(getFingerprint(clientCertificate.getValue()[0]));
				cred.setCertCredential(certCred);
				break;
			case WifiEnterpriseConfig.Eap.PWD:
				Log.i(getClass().getSimpleName(), "Not creating Passpoint configuration due to unsupported EAP type " + enterpriseEAP);
				return null; // known but unsupported EAP method
			case WifiEnterpriseConfig.Eap.PEAP:
				// Fall-through
				// TODO Android doesn't support PEAP for Passpoint
				// but we cannot know if the eap-config contained a TTLS profile as well,
				// so we'll assume it does.
			case WifiEnterpriseConfig.Eap.TTLS:
				byte[] passwordBytes = password.getBytes(Charset.defaultCharset()); // TODO explicitly use UTF-8?
				String base64 = Base64.encodeToString(passwordBytes, Base64.DEFAULT);

				Credential.UserCredential us = new Credential.UserCredential();
				us.setUsername(username);
				us.setPassword(base64);
				us.setEapType(21); // 21 indicates TTLS (RFC 5281)
				// Android will always use anonymous@ for Passpoint
				switch (enterprisePhase2Auth) {
					// Strings from android.net.wifi.hotspot2.pps.Credential.UserCredential.AUTH_METHOD_*
					// All supported strings are listed in android.net.wifi.hotspot2.pps.Credential.SUPPORTED_AUTH
					case WifiEnterpriseConfig.Phase2.MSCHAPV2:
						us.setNonEapInnerMethod("MS-CHAP-V2");
						break;
					case WifiEnterpriseConfig.Phase2.PAP:
						us.setNonEapInnerMethod("PAP");
						break;
					case WifiEnterpriseConfig.Phase2.MSCHAP:
						us.setNonEapInnerMethod("MS-CHAP");
						break;
					default:
						throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.unknown.authmethod." + enterprisePhase2Auth);
				}

				cred.setUserCredential(us);
				break;
			default:
				throw new WifiEapConfiguratorException("plugin.wifieapconfigurator.error.unknown.eapmethod." + enterpriseEAP);
		}

		passpointConfig.setCredential(cred);

		return passpointConfig;
	}

	@RequiresApi(api = Build.VERSION_CODES.Q)
	public ArrayList<NetworkRequest> createNetworkRequests() throws WifiEapConfiguratorException {
		WifiEnterpriseConfig enterpriseConfig = createEnterpriseConfig();
		ArrayList<NetworkRequest> result = new ArrayList<>(ssids.length);
		for (String ssid : ssids) {
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

	public String getFqdn() {
		return fqdn;
	}
}
