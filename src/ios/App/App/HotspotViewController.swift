/*
	Copyright (C) 2018 Apple Inc. All Rights Reserved.
	See LICENSE.txt for this sample’s licensing information
	
	Abstract:
	Main view controller.
 */
 
import UIKit
 
/// This view controller displays a list of persistent hotspot configurations
/// and lets the user add or remove configurations.
 
class HotspotsViewController : UITableViewController, AddViewControllerDelegate {
 
	/// A reference to the ‘model’ object that represents our hotspot
	/// configurations.
	///
	/// This is injected by our parent (the app delegate in this case).
 
	var manager: HotspotManager! = nil {
		willSet {
			if let m = newValue {
				NotificationCenter.default.removeObserver(self, name: HotspotManager.configurationsDidChange, object: m)
			}
		}
		didSet {
			if let m = self.manager {
				NotificationCenter.default.addObserver(self, selector: #selector(configurationsDidChange(note:)), name: HotspotManager.configurationsDidChange, object: m)
			}
			if self.isViewLoaded {
				self.tableView.reloadData()
			}
		}
	}
 
	deinit {
		NotificationCenter.default.removeObserver(self)
	}
	
	/// Called in response to a `HotspotManager.configurationsDidChange`
	/// notification.
 
	@objc
	private func configurationsDidChange(note: Notification) {
		if self.isViewLoaded {
			self.tableView.reloadData()
		}
	}
	
	override func viewDidLoad() {
		super.viewDidLoad()
		NotificationCenter.default.addObserver(self, selector: #selector(didActivate(note:)), name: UIApplication.didBecomeActiveNotification, object: nil)
	}
		
	override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
		if segue.identifier == "addSegue" {
			self.prepareForAddViewController(segue: segue)
		} else {
			super.prepare(for: segue, sender: sender)
		}
	}
	
	/// Called by the `deleteAction(_:)` method to delete the specified
	/// configuration.
	///
	/// - Parameter ssid: The SSID of the configuration to delete.
	
	private func remove(ssid: String) {
		NSLog("will remove '%@'", ssid)
		self.manager.remove(ssid: ssid) { (error) in
			if let error = error as NSError? {
				NSLog("did not remove '%@', error %@ / %d", ssid, error.domain, error.code)
				return
			}
			NSLog("did remove '%@'", ssid)
		}
	}
	
	/// Called when the user taps the *Delete* button in a table view cell to
	/// delete the associated SSID.
	///
	/// This action can be sent by the *Delete* button in any one of our
	/// `hotspot` cells. We receive it via the responder chain (old school!). We
	/// walk up the view hierarchy to find the cell and then get the SSID from
	/// that.
 
	@IBAction
	private func deleteAction(_ sender: UIButton) {
		for view in sequence(first: sender as UIView, next: { $0.superview }) {
			if let cell = view as? HotspotCell {
				self.remove(ssid: cell.ssidLabel.text!)
				return
			}
		}
		fatalError()
	}
	
	/// Called when the user taps the *Test* button.
	///
	/// This is a convenient place to put test code.  Right now I have code that
	/// logs the current SSID.
 
	@IBAction
	private func testAction(_ sender: Any) {
		NSLog("test action")
		NSLog("current SSID: %@", self.manager.currentSSID ?? "nil")
	}
	
	/// Called in response to a `Notification.UIApplicationDidBecomeActive`.
	///
	/// This calls through to the `refresh()` method on the manager.  That
	/// method has extensive documentation explaining why it’s necessary.
	
	@objc
	private func didActivate(note: Notification) {
		NSLog("did activate")
		self.manager.refresh()
	}
}
 
// MARK: - Table view delegate and data source callbacks
 
extension HotspotsViewController {
 
	override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return max(self.manager.configurationNames.count, 1)
	}
	
	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		guard self.manager.configurationNames.count != 0 else {
			return tableView.dequeueReusableCell(withIdentifier: "none", for: indexPath)
		}
		let index = indexPath.row
		let cell = tableView.dequeueReusableCell(withIdentifier: "hotspot", for: indexPath) as! HotspotCell
		cell.ssidLabel.text = self.manager.configurationNames[index]
		return cell
	}
 
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		self.tableView.deselectRow(at: indexPath, animated: true)
	}
}
 
// MARK: - AddViewControllerDelegate management and delegate callbacks
 
extension HotspotsViewController {
 
	/// Called when the `addSegue` fires.
	///
	/// This sets us as the delegate on the target view controller.
	
	private func prepareForAddViewController(segue: UIStoryboardSegue) {
		// Set ourselves as the delegate so we can hear about completion.
		let vc = (segue.destination as! UINavigationController).viewControllers[0] as! AddViewController
		vc.delegate = self
	}
 
	func add(network: AddViewController.Network, addViewController: AddViewController) {
		self.dismiss(animated: true, completion: nil)
		NSLog("will add '%@', joinOnce %@", network.ssid, "\(network.joinOnce)")
		self.manager.add(network: network) { (error) in
			if let error = error as NSError? {
				NSLog("did not add '%@', error %@ / %d", network.ssid, error.domain, error.code)
				self.presentAlert(with: error)
				return
			}
			NSLog("did add '%@'", network.ssid)
		}
	}
	
	func cancel(addViewController: AddViewController) {
		self.dismiss(animated: true, completion: nil)
	}
 
	/// Present a bare bones error alert.
	///
	/// In real app you would, of course, integrate this with your app’s overall
	/// error display infrastructure.
	///
	/// - important: This alert is not suitable for human consumption (it’s not
	///   localised, it displays an error code rather than an error message, and so
	///   on). Normally I wouldn't display an error alert in a sample project like
	///   this, and instead just rely on logging, but in this case there are some
	///   really non-obvious errors (like the WPA2 password being too short) and
	///   it’s easy to end up confused if the only indication of failure is a log
	///   message.
	///
	/// - Parameter error: The error to display.
	
	private func presentAlert(with error: NSError) {
		let ac = UIAlertController(title: "Add Failed", message: "\(error.domain) / \(error.code)", preferredStyle: .alert)
		ac.addAction(UIAlertAction(title: "OK", style: UIAlertAction.Style.default, handler: nil))
		self.present(ac, animated: true, completion: nil)
	}
}
 
/// A custom table view cell that exists so we can associate an SSID value with
/// each cell.
 
class HotspotCell : UITableViewCell {
	@IBOutlet var ssidLabel: UILabel!
}

