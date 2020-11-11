/*
	Copyright (C) 2018 Apple Inc. All Rights Reserved.
	See LICENSE.txt for this sample’s licensing information
	
	Abstract:
	Runs the UI to add a new SSID.
 */
 
import UIKit
 
/// This simple view controller lets the user enter the details of a network to
/// add.
///
/// It’s expecting to be presented modally, and calls delegate methods to
/// indicate that it’s done.
///
/// To simplify things this holds the ‘truth‘ (like the current SSID) in views
/// rather than in a model object or its own properties.  The goal here is to
/// keep things simple, not to show ideal app architecture.
///
/// Also see the comments about user defaults wrangling below.
 
class AddViewController : UITableViewController {
 
	/// An alias to bring this type into our namespace.
	
	typealias Delegate = AddViewControllerDelegate
 
	/// When the view controller is done it calls methods on this delegate.
	
	weak var delegate: Delegate?
	
	override func viewDidLoad() {
		super.viewDidLoad()
		self.readDefaults()
		self.updateViews()
	}
	
	@IBOutlet private var addBarButton: UIBarButtonItem!
	@IBOutlet private var ssidField: UITextField!
	@IBOutlet private var passwordField: UITextField!
	@IBOutlet private var isWEPSwitch: UISwitch!
	@IBOutlet private var joinOnceSwitch: UISwitch!
 
	/// The current SSID value.
	
	private var ssid: String {
		return self.ssidField.text ?? ""
	}
 
	/// The current password value.
	
	private var password: String? {
		return self.passwordField.text.flatMap({ $0.isEmpty ? nil : $0 })
	}
 
	/// Enables the *Add* button based on the current state of other views.
	
	private func updateViews() {
		self.addBarButton.isEnabled = !self.ssid.isEmpty
	}
	
	/// An alias to bring this type into our namespace.
 
	typealias Network = HotspotManager.Network
	
	/// Called when the user taps the *Add* button.
 
	@IBAction
	private func addAction(_ sender: Any) {
		let ssid = self.ssid
		guard !ssid.isEmpty else {
			// The Add button should have been disabled in this case, so we
			// assert if it happens.
			assert(false)
			return
		}
		let network = Network(
			ssid: ssid,
			password: self.password,
			isWEP: self.isWEPSwitch.isOn,
			joinOnce: self.joinOnceSwitch.isOn
		)
		self.delegate?.add(network: network, addViewController: self)
		self.saveDefaults()
	}
 
	/// Called when the user taps the *Cancel* button.
 
	@IBAction
	private func cancelAction(_ sender: Any) {
		self.delegate?.cancel(addViewController: self)
		self.saveDefaults()
	}
	
	/// Called when the changes the text in a text field.
 
	@IBAction
	private func textFieldDidChange(_ sender: Any) {
		self.updateViews()
	}
}
 
// MARK: - User defaults wrangling
 
// Note that our approach to user defaults is kinda weird.  For example:
//
// * We save to user defaults even if the user taps *Cancel*.
//
// * We store a password in the user defaults, whereas passwords belong in the
//   keychain.
//
// This all makes sense in the context of a sample app like this one, but in a
// real app you should store security sensitive data in the keychain.
 
extension AddViewController {
	
	/// Set up the views from user default.
	
	private func readDefaults() {
		let defaults = UserDefaults.standard
		self.ssidField.text = defaults.string(forKey: "addSSID")
		self.passwordField.text = defaults.string(forKey: "addPassword")
		self.isWEPSwitch.isOn = defaults.bool(forKey: "addIsWEP")
		self.joinOnceSwitch.isOn = defaults.bool(forKey: "addJoinOnce")
	}
	
	/// Saves the views to user default.
 
	private func saveDefaults() {
		let defaults = UserDefaults.standard
		func save(string value: String?, key: String) {
			if let v = value, !v.isEmpty {
				defaults.set(v, forKey: key)
			} else {
				defaults.removeObject(forKey: key)
			}
		}
		save(string: self.ssidField.text, key: "addSSID")
		save(string: self.passwordField.text, key: "addPassword")
		defaults.set(self.isWEPSwitch.isOn, forKey: "addIsWEP")
		defaults.set(self.joinOnceSwitch.isOn, forKey: "addJoinOnce")
	}
}
 
protocol AddViewControllerDelegate : AnyObject {
 
	/// This delegate callback is called when the user successfully enters the
	/// details of a network to add.
	///
	/// - Parameters:
	///   - network: Details of the network to add.
	///   - addViewController: A reference to the view controller itself.
	
	func add(network: AddViewController.Network, addViewController: AddViewController)
 
	/// This delegate callback is called when the user hits cancel.
	///
	///   - addViewController: A reference to the view controller itself.
 
	func cancel(addViewController: AddViewController)
}
