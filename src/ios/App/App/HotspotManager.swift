/*
	Copyright (C) 2018 Apple Inc. All Rights Reserved.
	See LICENSE.txt for this sample’s licensing information
	
	Abstract:
	Wraps NEHotspotConfigurationManager to make it easier for the view controller to use.
 */
 
import NetworkExtension
 
#if targetEnvironment(simulator)
 
let error = _NEHotspotConfigurationManager_is_not_supported_the_simulator_
 
// Swift doesn’t support the equivalent of C’s #error (r. 16015824),
// so we use the above to get a meaningful error in the Issues navigator.
 
#endif
 
/// HotspotManager wraps NEHotspotConfigurationManager to make it easier for the
/// view controller to use.
///
/// The main benefit to this class is that it exports a `configurationNames`
/// that (more-or-less) automatically updates to reflect the current persistent
/// configurations.  It also posts a notification, `configurationsDidChange`,
/// when that list changes.
///
/// The only weird part about this class is the `refresh()` method.  See its doc
/// comment for the details.
 
class HotspotManager {
 
	init() {
		self.manager = NEHotspotConfigurationManager.shared
		self.startUpdate()
	}
	
	/// A reference to the underlying iOS object for managing configurations.
	
	private let manager: NEHotspotConfigurationManager
	
	/// A list of persistent SSIDs created by this app.
	
	private(set) var configurationNames: [String] = [] {
		didSet {
			NotificationCenter.default.post(name: HotspotManager.configurationsDidChange, object: self)
		}
	}
 
	/// Posted when `configurationNames` changes.
	
	static let configurationsDidChange = Notification.Name("HotspotManagerConfigurationsDidChange")
		
	/// True when this object is in the process of updating the
	/// `configurationNames` list.
	///
	/// This prevents us from redundantly calling
	/// `getConfiguredSSIDs(completionHandler:)`, which works but is kinda
	/// pointless.
	
	private var isUpdating: Bool = false
	
	/// Starts the process of updating the `configurationNames` list.
	
	private func startUpdate() {
		guard !self.isUpdating else {
			return
		}
		NSLog("will start update")
		self.isUpdating = true
		self.manager.getConfiguredSSIDs { (names) in
			assert(Thread.isMainThread)
			if names != self.configurationNames {
				self.configurationNames = names
			}
			self.isUpdating = false
			NSLog("did end update")
		}
	}
	
	/// A simple data type that isolates our clients from
	/// NEHotspotConfiguration.
	
	struct Network {
	
		/// The name of the network to join.
		
		var ssid: String
		
		/// The password of that network, or nil if there’s no password.
		
		var password: String?
		
		/// True if the password is for WEP, that is, a string of hex digits.
		///
		/// See the discussion of
		/// `NEHotspotConfiguration.init(ssid:passphrase:isWEP:)` for details.
		
		var isWEP: Bool
		
		/// Indicates whether the network is persistent (false) or one-off
		/// (true).
		
		var joinOnce: Bool
		
		/// Returns a `NEHotspotConfiguration` object derived from the
		/// properties of this value.
 
		fileprivate var configuration: NEHotspotConfiguration {
			let config: NEHotspotConfiguration
			if let password = password {
				config = NEHotspotConfiguration(ssid: self.ssid, passphrase: password, isWEP: self.isWEP)
			} else {
				config = NEHotspotConfiguration(ssid: self.ssid)
			}
			config.joinOnce = self.joinOnce
			return config
		}
	}
	
	/// Asks the user whether the device to join the specified network and, if
	/// they agree, joins that network.
	///
	/// - Parameters:
	///   - network: The network to join.
	///   - completion: Called on the main queue once the join operation has
	///     completed. `error` will be nil if the join was successful, or an
	///     error otherwise.  Note that some errors are not actual errors, most
	///     notably `NEHotspotConfigurationErrorAlreadyAssociated`.
	
	func add(network: Network, completion: @escaping (Error?) -> Void) {
		self.manager.apply(network.configuration) { (error) in
			assert(Thread.isMainThread)
			self.startUpdate()
			completion(error)
		}
		// Start an update now.  The comments associated with `refresh()`
		// explain why I do this.
		self.startUpdate()
	}
	
	/// Removes a persistent configuration added via `add(network:completion:)`.
	///
	/// - Parameters:
	///   - ssid: The SSID to remove.
	///   - completion: Called on the main queue once the remove operation has
	///     completed. `error` will be nil if the remove was successful, which
	///     is currently always the case.
	
	func remove(ssid: String, completion: @escaping (Error?) -> Void) {
		self.manager.removeConfiguration(forSSID: ssid)
		self.startUpdate()
		DispatchQueue.main.async {
			completion(nil)
		}
	}
	
	/// Forces a refresh of the configuration names list.
	///
	/// I’d rather not have this but it turned out to be necessary.
	/// Specifically, when adding a configuration I found that there’s no
	/// obvious place to call `startUpdate()` in order to get a new
	/// configuration names list:
	///
	/// * If I call it when `apply(:completionHandler:)` calls its completion
	///   handler, it doesn’t show up in the list for a long time while the
	///   Wi-Fi subsystem tries to find and join the network.
	///
	/// * If I call it immediately after returing from
	///   `apply(:completionHandler:)`, it doesn’t show up because the user
	///   hasn’t confirmed that they want to allow this operation yet.
	///
	/// I resolved this by having the view controller do a refresh when the app
	/// activates, which happens when the join alert is dismissed.  It’s also a
	/// generally good idea for other reasons, for example, the user might have
	/// deleted the configuration from *Settings* > *Wi-Fi*.
	
	func refresh() {
		self.startUpdate()
	}
}
 
import SystemConfiguration.CaptiveNetwork
 
extension HotspotManager {
 
	/// Gets the current SSID using the legacy Captive Network API.
	///
	/// During debugging it’s helpful to know what network you’re on.  The
	/// legacy Captive Network API has a way to do this, but it’s kinda tricky
	/// to call from Swift so we provide a wrapper here.
	///
	/// - important: Using `CNCopyCurrentNetworkInfo` in production code is not
	///   a good idea.  If you do use it, make sure you code defensively so that
	///   your app behaves in a reasonable fashion if it fails.  This code, for
	///   example, carefully checks for failures and returns nil if anything
	///   goes wrong.
	
	var currentSSID: String? {
		guard let interfaces = CNCopySupportedInterfaces() as? [String],
			  let interface = interfaces.first else {
			return nil
		}
		guard let interfaceDict = CNCopyCurrentNetworkInfo(interface as NSString) as? [String:Any] else {
			return nil
		}
		guard let ssid = interfaceDict[kCNNetworkInfoKeySSID as String] as? String else {
			return nil
		}
		return ssid
	}
}
