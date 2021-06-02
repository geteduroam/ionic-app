package com.emergya.wifieapconfigurator.config;

import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiConfiguration;
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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.IntFunction;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Class representing a Wi-Fi profile that can be installed on any Android version
 *
 * The class contains all information necessary to configure a Wi-Fi network,
 * such as EAP types used, username/password or client certificate and EAP types.
 *
 * There are different methods for configuring a Wi-Fi network on Android, this class can output
 * configuration objects for different configuration methods.  Configuration object that can be
 * created are WifiConfiguration, WifiNetworkSuggestion and NetworkRequest
 */
public class WifiProfile {

	private final String[] ssids;
	private final long[] oids;
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
	 * Parse a JSON object with Wi-Fi configuration settings and store them in this object.
	 *
	 * The following fields are always required:
	 * * {@code String[] ssid} SSIDs in UTF-8
	 * * {@code String[] servername} Server names for server certificate validation
	 * * {@code String[] caCertificate} Certificate chains for server certificate validation
	 * * {@code int eap} IANA EAP code, {@code 13} = {@code TLS}, {@code 21} = TTLS, {@code 25} = PEAP
	 * * {@code String id} FQDN for this profile, used for Passpoint home ID matching, often identical to realm
	 *
	 * The following fields are required for TLS profiles
	 * * {@code String clientCertificate} Base64 encoded PKCS12 container
	 * * {@code String passPhrase} Passphrase to decrypt PKCS12 container
	 *
	 * The following fields are required for non-TLS profiles (TTLS or PEAP)
	 * * {@code String username} Username for authentication, including @realm
	 * * {@code String password} Password for authentication
	 * * {@code int auth} CAT identifier for Phase2 auth (see XSD)
	 *
	 * The following fields are optional, but must be of the correct type if provided
	 * * {@code String[] oid} OID hex-encoded strings for Passpoint
	 * * {@code anonymous} Outer identity
	 *
	 * @param config Wi-Fi profile from ionic
	 * @throws IllegalStateException               Internal error; logic error or OS bug
	 * @throws EapConfigCAException                Invalid CA certificate/chain provided
	 * @throws EapConfigClientCertificateException Invalid client certificate provided
	 * @throws EapConfigValueException             A value is missing or fails a constraint
	 * @link https://www.iana.org/assignments/eap-numbers/eap-numbers.xhtml#eap-numbers-4
	 * @link https://github.com/GEANT/CAT/blob/v2.0.3/devices/xml/eap-metadata.xsd
	 */
	public WifiProfile(JSONObject config) throws EapConfigCAException, EapConfigClientCertificateException, EapConfigValueException {
		try {
			// Required fields
			ssids = jsonArrayToStringArray(config.getJSONArray("ssid"));
			serverNames = jsonArrayToStringArray(config.getJSONArray("servername"));
			enterpriseEAP = getAndroidEAPTypeFromIanaEAPType(config.getInt("eap"));
			fqdn = config.getString("id");
			try {
				caCertificates = Arrays.stream(
					getCertificates(
						jsonArrayToStringArray(
							config.getJSONArray("caCertificate")
						)
					)
				).filter(new Predicate<X509Certificate>() {
					@Override
					public boolean test(X509Certificate certificate) {
						// We really shouldn't expect any certificate here to NOT be a CA,
						// CAT shows a nice red warning when you try to configure this,
						// but experience shows that sometimes this is not enough of a deterrent.
						// We may very well block profiles like this, but then it should be done BEFORE
						// the user enters their username/password, not after.

						return isCA(certificate);
					}
				}).collect(Collectors.<X509Certificate>toList());
			} catch (CertificateException e) {
				throw new EapConfigCAException(e);
			}

			// Conditional fields
			if (enterpriseEAP != WifiEnterpriseConfig.Eap.TLS) {
				username = config.has("username") ? config.getString("username") : null;
				password = config.has("password") ? config.getString("password") : null;
				enterprisePhase2Auth = getAndroidPhase2FromCATAuthMethod(config.getInt("auth"));

				clientCertificate = null;
			} else {
				try {
					clientCertificate = getClientCertificate(config.getString("clientCertificate"), config.getString("passPhrase"));
				} catch (CertificateException e) {
					throw new EapConfigClientCertificateException("Unable to read client certificate", e);
				} catch (NoSuchAlgorithmException e) {
					throw new EapConfigClientCertificateException("Unknown algorithm in PKCS12 store", e);
				} catch (UnrecoverableKeyException e) {
					throw new EapConfigClientCertificateException("Unable to read client certificate key", e);
				}

				username = null;
				password = null;
				enterprisePhase2Auth = -1;
			}

			// Optional fields
			anonymousIdentity = config.has("anonymous") ? config.getString("anonymous") : null;
			oids = config.has("oid") ? toLongPrimitive(
				Arrays.stream(
					jsonArrayToStringArray(
						config.getJSONArray("oid")
					)
				).map(new Function<String, Long>() {
					@Override
					public Long apply(String oid) {
						return oid.startsWith("0x") ? Long.decode(oid) : Long.decode("0x" + oid);
					}
				}).toArray(new IntFunction<Long[]>() {
					@Override
					public Long[] apply(int size) {
						return new Long[size];
					}
				})) : new long[0];
		} catch (JSONException e) {
			throw new EapConfigValueException(e.getMessage(), e);
		} catch (NumberFormatException e) {
			throw new EapConfigValueException("OID contains invalid HEX string", e);
		}

		if (ssids.length == 0 && oids.length == 0) {
			throw new EapConfigValueException("List of SSIDs and OIDs cannot both be empty");
		}
		if (serverNames.length == 0) {
			throw new EapConfigValueException("Empty list of server names provided");
		}
	}

	/**
	 * Check if the passphrase can decrypt the PKCS12 container
	 *
	 * @param clientCertificate Base64 encoded client certificate in a PKCS12 container
	 * @param passphrase        The passphrase
	 * @return The passphrase can decrypt the client certificate
	 * @throws NullPointerException  Any of the parameters was NULL
	 * @throws IllegalStateException Internal error
	 */
	public static boolean validatePassPhrase(String clientCertificate, String passphrase) throws NullPointerException, IllegalStateException {
		try {
			KeyStore pkcs12ks = KeyStore.getInstance("pkcs12");

			byte[] bytes = Base64.decode(clientCertificate, Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);
			InputStream in = new BufferedInputStream(b);

			pkcs12ks.load(in, passphrase.toCharArray());
		} catch (CertificateException e) {
			return false;
		} catch (IOException | NoSuchAlgorithmException | KeyStoreException e) {
			throw new IllegalStateException("The passphrase could not be tested", e);
		}
		return true;
	}

	/**
	 * Convert from {@code Long[]} to {@code long[]}
	 */
	private static long[] toLongPrimitive(Long... objects) {
		long[] primitives = new long[objects.length];
		for (int i = 0; i < objects.length; i++)
			primitives[i] = objects[i];

		return primitives;
	}

	/**
	 * Convert a JSONArray of strings to a native String array
	 *
	 * @param array Input array
	 * @return Output array
	 * @throws JSONException An entry in the input array contains something different than a String
	 */
	private static String[] jsonArrayToStringArray(JSONArray array) throws JSONException {
		String[] result = new String[array.length()];
		for (int i = 0; i < array.length(); i++)
			result[i] = array.getString(i);
		return result;
	}

	/**
	 * Converts an IANA EAP type integer to an Android EAP type integer
	 *
	 * @param ianaEAPMethod EAP type as used in eap-config
	 * @return A value from WifiEnterpriseConfig.Eap (TLS,TTLS,PEAP)
	 * @throws EapConfigValueException If there is no mapping from the ianaEAPMethod to an Android EAP type
	 * @link https://www.iana.org/assignments/eap-numbers/eap-numbers.xhtml#eap-numbers-4
	 */
	private static int getAndroidEAPTypeFromIanaEAPType(int ianaEAPMethod) throws EapConfigValueException {
		switch (ianaEAPMethod) {
			case 13:
				return WifiEnterpriseConfig.Eap.TLS;
			case 21:
				return WifiEnterpriseConfig.Eap.TTLS;
			case 25:
				return WifiEnterpriseConfig.Eap.PEAP;
			default:
				throw new EapConfigValueException("Unknown IANA EAP type " + ianaEAPMethod);
		}
	}

	/**
	 * Converts a eap-config/CAT inner type to an Android Phase2 integer
	 *
	 * @param eapConfigAuthMethod Auth method as used in eap-config
	 * @return ENUM from WifiEnterpriseConfig.Phase2 (PAP/MSCHAP/MSCHAPv2) or -1 if no match
	 * @throws EapConfigValueException If there is no mapping from the eapConfigAuthMethod to an Android Phase 2 integer
	 */
	private static int getAndroidPhase2FromCATAuthMethod(int eapConfigAuthMethod) throws EapConfigValueException {
		switch (eapConfigAuthMethod) {
			case -1:
				return WifiEnterpriseConfig.Phase2.PAP;
			case -2:
				return WifiEnterpriseConfig.Phase2.MSCHAP;
			case -3:
			case 26: /* Android cannot do TTLS-EAP-MSCHAPv2, we expect the ionic code to not let it happen, but if it does, try TTLS-MSCHAPv2 instead */
				// This currently DOES happen because CAT has a bug where it reports TTLS-MSCHAPv2 as TTLS-EAP-MSCHAPv2,
				// so denying this would prevent profiles from being side-loaded
				return WifiEnterpriseConfig.Phase2.MSCHAPV2;
			/*
			case _: // TODO Not supported by the eap-config format, so no CAT auth type maps to GTC
				return WifiEnterpriseConfig.Phase2.GTC;
			*/
			default:
				throw new EapConfigValueException("Unknown eap-config auth method " + eapConfigAuthMethod);
		}
	}

	/**
	 * Get the longest common suffix domain components from a list of hostnames
	 *
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
	 * Returns fingerprint of a certificate
	 *
	 * @param certificate The certificate to inspect
	 * @return The fingerprint of the certificate
	 */
	private static byte[] getFingerprint(X509Certificate certificate) {
		try {
			MessageDigest digester = MessageDigest.getInstance("SHA-256");
			digester.reset();
			return digester.digest(certificate.getEncoded());
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("Unable to digest SHA-256", e);
		} catch (CertificateEncodingException e) {
			throw new IllegalArgumentException("Unable to encode certificate as DER", e);
		}
	}

	/**
	 * Extract private key and certificate chain from a PKCS12 store
	 *
	 * @param pkcs12StoreB64 PKCS12 store base64 encoded
	 * @param passphrase     Passphrase to open the PKCS12 store
	 * @return Tuple with private key and certificate + chain
	 * @throws NullPointerException      NULL PKCS12 store provided
	 * @throws CertificateException      Certificate from the store could not be loaded
	 * @throws NoSuchAlgorithmException  Algorithm for checking integrity or recovering the private key cannot be found
	 * @throws UnrecoverableKeyException Key cannot be recovered; typically incorrect passphrase
	 */
	private static Map.Entry<PrivateKey, X509Certificate[]> getClientCertificate(String pkcs12StoreB64, String passphrase) throws CertificateException, NoSuchAlgorithmException, UnrecoverableKeyException {
		try {
			byte[] bytes = Base64.decode(pkcs12StoreB64, Base64.NO_WRAP);
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
				} catch (ArrayStoreException e) {
					Log.w("WifiProfile", "A certificate in the ClientCertificate chain is not an instance of X509Certificate");
				}
			}
			// KeyStoreException, NoSuchAlgorithmException, UnrecoverableKeyException, CertificateException
		} catch (KeyStoreException e) {
			throw new IllegalArgumentException("Unable to read ", e);
		} catch (IOException e) {
			if (e.getCause() instanceof UnrecoverableKeyException)
				throw (UnrecoverableKeyException) e.getCause();

			// This shouldn't happen, the InputStream is already in memory
			throw new IllegalStateException("Unexpected I/O error reading key data");
		}
		throw new IllegalArgumentException("Cannot extract a X509Certificate from the certificate store");
	}

	/**
	 * Convert an array of base64 encoded DER certificates to X509Certificate objects
	 *
	 * @param caCertificates DER+Base64 encoded X509 certificates
	 * @return Native X509Certificate objects
	 * @throws CertificateException Unable to parse a certificate
	 */
	private static X509Certificate[] getCertificates(String[] caCertificates) throws CertificateException {
		CertificateFactory certFactory;
		X509Certificate[] certificates = new X509Certificate[caCertificates.length];
		// building the certificates
		for (int i = 0; i < caCertificates.length; i++) {
			byte[] bytes = Base64.decode(caCertificates[i], Base64.NO_WRAP);
			ByteArrayInputStream b = new ByteArrayInputStream(bytes);

			certFactory = CertificateFactory.getInstance("X.509");
			X509Certificate certificate = (X509Certificate) certFactory.generateCertificate(b);
			certificates[i] = certificate;
		}

		return certificates;
	}

	/**
	 * Check that a certificate is marked as a CA
	 *
	 * A qualifying certificate has either KeyUsage bit 5 set,
	 * or has the first byte in OID 2.5.29.19 set to non-zero (not boolean false)
	 *
	 * @param certificate The certificate to check
	 * @return The certificate is a CA certificate
	 */
	private static boolean isCA(X509Certificate certificate) {
		boolean[] usage = certificate.getKeyUsage();

		// https://docs.oracle.com/javase/7/docs/api/java/security/cert/X509Certificate.html#getKeyUsage()
		// 5 is KeyUsage keyCertSign, which indicates the certificate is a CA
		if (usage != null && usage.length > 5 && usage[5]) {
			// This is a CA according to KeyUsage
			return true;
		} else {
			// Find out if this a CA according to Basic Constraints
			byte[] extension = certificate.getExtensionValue("2.5.29.19");
			return extension != null && extension.length > 1 && extension[0] != 0;
		}
	}

	/**
	 * Determines whether a certificate is a root certificate
	 *
	 * A root certificate is defined by being self-signed (issuer == subject) and being recognised
	 * as a CA by {@code isCA}.
	 *
	 * @param certificate The certificate to test
	 * @return The certificate is a root certificate
	 */
	protected static boolean isRootCertificate(X509Certificate certificate) {
		return certificate.getSubjectDN().toString().equals(certificate.getIssuerDN().toString()) && isCA(certificate);
	}

	/**
	 * Create SSID-based network suggestions for this profile
	 *
	 * This will return one suggestion per SSID.  The resulting list is generated on the fly,
	 * and may be safely modified by the caller.
	 *
	 * @return List of network suggestions, one per SSID
	 * @see this.buildPasspointSuggestion()
	 * @see this.buildNetworkRequests()
	 */
	@RequiresApi(api = Build.VERSION_CODES.Q)
	public List<WifiNetworkSuggestion> buildSSIDSuggestions() {
		// Initial capacity = amount of SSIDs + 1, to keep room for a a Passpoint configuration
		final WifiEnterpriseConfig enterpriseConfig = buildEnterpriseConfig();

		return Arrays.stream(ssids).map(new Function<String, WifiNetworkSuggestion>() {
			@Override
			public WifiNetworkSuggestion apply(String ssid) {
				return new WifiNetworkSuggestion.Builder()
					.setSsid(ssid)
					.setWpa2EnterpriseConfig(enterpriseConfig)
					.build();
			}
		}).collect(Collectors.<WifiNetworkSuggestion>toList());
	}

	/**
	 * Create Passpoint-based network suggestion for this profile
	 *
	 * A Passpoint suggestion can contain multiple OIDs, so the whole profile will always fit
	 * in a single suggestions.
	 *
	 * If there are no OIDs in this profile, this function will return NULL
	 *
	 * @return Network suggestion for Passpoint
	 * @see this.buildSSIDSuggestions()
	 * @see this.buildNetworkRequests()
	 */
	@RequiresApi(api = Build.VERSION_CODES.R)
	public WifiNetworkSuggestion buildPasspointSuggestion() {
		PasspointConfiguration passpointConfig = buildPasspointConfig();

		if (passpointConfig != null) {
			WifiNetworkSuggestion.Builder suggestionBuilder = new WifiNetworkSuggestion.Builder();
			suggestionBuilder.setPasspointConfig(passpointConfig);
			return suggestionBuilder.build();
		}

		return null;
	}

	/**
	 * Get all SSIDs for this profile
	 *
	 * @return SSIDs
	 */
	public String[] getSSIDs() {
		return Arrays.copyOf(ssids, ssids.length, String[].class);
	}

	/**
	 * Create an WifiEnterpriseConfig object which Android uses internally to configure Wi-Fi networks
	 *
	 * @return Wifi Enterprise configuration for this profile
	 * @see this.buildPasspointConfig()
	 */
	protected final WifiEnterpriseConfig buildEnterpriseConfig() {
		WifiEnterpriseConfig enterpriseConfig = new WifiEnterpriseConfig();

		enterpriseConfig.setAnonymousIdentity(anonymousIdentity);
		enterpriseConfig.setEapMethod(enterpriseEAP);
		enterpriseConfig.setCaCertificates(caCertificates.toArray(new X509Certificate[0]));

		assert (serverNames.length != 0); // Checked in WifiProfile constructor
		enterpriseConfig.setDomainSuffixMatch(getServerNamesDomainString());

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
				// This should not happen, getAndroidEAPTypeFromIanaEAPType should have complained
				throw new IllegalArgumentException("Invalid EAP type " + enterpriseEAP);
		}

		return enterpriseConfig;
	}

	/**
	 * Get the string that Android uses for server name validation.
	 *
	 * Server names are treated as suffix, but exact string match is also accepted.
	 *
	 * On Android 9, only a single name is supported.
	 * Thus, for Android 9, we will calculate the longest suffix match.
	 *
	 * On Android 10 and onwards, the string can be semicolon-separated,
	 * which is what we will do for these platforms.
	 *
	 * @return The server name
	 */
	private String getServerNamesDomainString() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			return String.join(";", serverNames);
		} else {
			return getLongestSuffix(serverNames);
		}
	}

	/**
	 * Create the configuration necessary to configure a passpoint and returns it
	 *
	 * @return Passpoint configuration for this profile
	 * @see this.buildEnterpriseConfig()
	 */
	public final PasspointConfiguration buildPasspointConfig() {
		if (oids.length == 0) {
			Log.i(getClass().getSimpleName(), "Not creating Passpoint configuration due to no OIDs set");
			return null;
		}
		PasspointConfiguration passpointConfig = new PasspointConfiguration();

		HomeSp homeSp = new HomeSp();
		// The FQDN in this case is the server names being used to verify the server certificate
		// Passpoint also has a domain, which is set later with Credential.setRealm(fqdn)
		homeSp.setFqdn(getServerNamesDomainString());
		homeSp.setFriendlyName(fqdn + " via Passpoint");
		homeSp.setRoamingConsortiumOis(oids);

		passpointConfig.setHomeSp(homeSp);

		Credential cred = new Credential();
		List<X509Certificate> rootCertificates = caCertificates.stream().filter(new Predicate<X509Certificate>() {
			@Override
			public boolean test(X509Certificate certificate) {
				return isRootCertificate(certificate);
			}
		}).collect(Collectors.<X509Certificate>toList());
		// TODO Add support for multiple CAs
		if (rootCertificates.size() == 1) {
			// Just use the first CA for Passpoint
			cred.setCaCertificate(rootCertificates.get(0));
		} else {
			Log.e(getClass().getSimpleName(), "Not creating Passpoint configuration due to too many CAs in the profile (1 supported, " + rootCertificates + " given)");
			return null;
		}
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
				// Android will always use outer anonymous@ for Passpoint
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
						// This should not happen, getAndroidPhase2FromCATAuthMethod should have complained
						throw new IllegalArgumentException("Invalid Phase2 type " + enterprisePhase2Auth);
				}

				cred.setUserCredential(us);
				break;
			default:
				// This should not happen, getAndroidEAPTypeFromIanaEAPType should have complained
				throw new IllegalArgumentException("Invalid EAP type " + enterpriseEAP);
		}

		passpointConfig.setCredential(cred);

		return passpointConfig;
	}

	/**
	 * Create Network Requests which can be used to configure a network on API 30 and up
	 *
	 * The advantage of Network Requests is that they are visible as real networks,
	 * as opposed to Suggestions, which are only visible when connected.
	 *
	 * @return List of network requests
	 * @see this.buildSSIDSuggestions()
	 * @see this.buildPasspointSuggestion()
	 */
	@RequiresApi(api = Build.VERSION_CODES.Q)
	public List<NetworkRequest> buildNetworkRequests() {
		final WifiEnterpriseConfig enterpriseConfig = buildEnterpriseConfig();
		final NetworkRequest.Builder networkRequestBuilder = new NetworkRequest.Builder();
		networkRequestBuilder.addTransportType(NetworkCapabilities.TRANSPORT_WIFI);
		return Arrays.stream(ssids).map(new Function<String, NetworkRequest>() {
			@Override
			public NetworkRequest apply(String ssid) {
				WifiNetworkSpecifier.Builder builder = new WifiNetworkSpecifier.Builder();
				builder.setSsid(ssid);
				builder.setWpa2EnterpriseConfig(enterpriseConfig);
				WifiNetworkSpecifier wifiNetworkSpecifier = builder.build();
				networkRequestBuilder.setNetworkSpecifier(wifiNetworkSpecifier);
				return networkRequestBuilder.build();
			}
		}).collect(Collectors.<NetworkRequest>toList());
		// TODO create Passpoint network request
	}

	/**
	 * Create a WifiConfiguration object which can be installed on API target 28
	 *
	 * @return List of Wi-Fi configurations
	 */
	@SuppressWarnings("deprecation")
	public List<WifiConfiguration> buildWifiConfigurations() {
		final WifiEnterpriseConfig enterpriseConfig = buildEnterpriseConfig();
		return Arrays.stream(ssids).map(new Function<String, WifiConfiguration>() {
			@Override
			public WifiConfiguration apply(String ssid) {
				WifiConfiguration config = new WifiConfiguration();
				config.SSID = "\"" + ssid + "\"";
				config.priority = 1;
				config.status = WifiConfiguration.Status.ENABLED;
				config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_EAP);
				config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.IEEE8021X);
				config.enterpriseConfig = enterpriseConfig;
				return config;
			}
		}).collect(Collectors.<WifiConfiguration>toList());
	}
}
