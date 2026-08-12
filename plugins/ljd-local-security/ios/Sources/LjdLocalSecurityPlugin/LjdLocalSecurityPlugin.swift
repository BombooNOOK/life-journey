import Foundation
import Capacitor
import Security

/**
 * LJD storage-security native bridge (production helper).
 *
 * Keeps FileManager path / backup-exclusion / File Protection inspection.
 * Does NOT store DB encryption secrets (plugin built-in Keychain is the DB-key path).
 * Does NOT include PoC dummy keystore, lock probes, or destructive deletePath.
 *
 * Domain layer must not import Security framework.
 */
@objc(LjdLocalSecurityPlugin)
public class LjdLocalSecurityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LjdLocalSecurityPlugin"
    public let jsName = "LjdLocalSecurity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "inspectPath", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setCompleteProtection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setExcludedFromBackup", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resolveApplicationSupportLjdDir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "inspectGenericPasswordAccessibility", returnType: CAPPluginReturnPromise),
    ]

    @objc func inspectPath(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.reject("path required")
            return
        }
        let url = URL(fileURLWithPath: normalizePath(path))
        call.resolve(inspect(url: url))
    }

    @objc func setCompleteProtection(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.reject("path required")
            return
        }
        let url = URL(fileURLWithPath: normalizePath(path))
        do {
            try FileManager.default.setAttributes(
                [.protectionKey: FileProtectionType.complete],
                ofItemAtPath: url.path
            )
            do {
                try (url as NSURL).setResourceValue(
                    URLFileProtection.complete,
                    forKey: .fileProtectionKey
                )
            } catch {
                // FileManager path already applied.
            }
            call.resolve(inspect(url: url))
        } catch {
            call.reject("setCompleteProtection failed: \(error.localizedDescription)")
        }
    }

    @objc func setExcludedFromBackup(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.reject("path required")
            return
        }
        guard let excluded = call.getBool("excluded") else {
            call.reject("excluded bool required")
            return
        }
        var url = URL(fileURLWithPath: normalizePath(path))
        do {
            var values = URLResourceValues()
            values.isExcludedFromBackup = excluded
            try url.setResourceValues(values)
            call.resolve(inspect(url: url))
        } catch {
            call.reject("setExcludedFromBackup failed: \(error.localizedDescription)")
        }
    }

    @objc func resolveApplicationSupportLjdDir(_ call: CAPPluginCall) {
        let fm = FileManager.default
        guard let appSupport = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            call.reject("applicationSupportDirectory unavailable")
            return
        }
        let bundleId = Bundle.main.bundleIdentifier ?? "app.bamboonook.ljd"
        let ljdDir = appSupport.appendingPathComponent(bundleId, isDirectory: true)
        let databasesDir = ljdDir.appendingPathComponent("databases", isDirectory: true)
        call.resolve([
            "applicationSupportRoot": appSupport.path,
            "bundleIdentifier": bundleId,
            "ljdApplicationSupportDir": ljdDir.path,
            "ljdDatabasesDir": databasesDir.path,
            "pluginRelativeLocation": "Library/Application Support/\(bundleId)",
            "note": "pluginRelativeLocation is relative to the app container; do not hardcode absolute paths",
        ])
    }

    /// Attributes-only Keychain probe. NEVER requests kSecReturnData.
    @objc func inspectGenericPasswordAccessibility(_ call: CAPPluginCall) {
        guard let service = call.getString("service"), !service.isEmpty else {
            call.reject("service required")
            return
        }
        guard let account = call.getString("account"), !account.isEmpty else {
            call.reject("account required")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnAttributes as String: true,
            kSecReturnData as String: false,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            call.resolve([
                "found": false,
                "service": service,
                "account": account,
                "accessibility": NSNull(),
                "accessibilityRawPresent": false,
                "verdictHint": "C",
                "returnedSecretData": false,
                "note": "item not found",
            ])
            return
        }
        guard status == errSecSuccess else {
            call.reject("SecItemCopyMatching attrs failed: \(status)")
            return
        }
        guard let attrs = item as? [String: Any] else {
            call.resolve([
                "found": true,
                "service": service,
                "account": account,
                "accessibility": NSNull(),
                "accessibilityRawPresent": false,
                "verdictHint": "C",
                "returnedSecretData": false,
                "note": "attributes cast failed",
            ])
            return
        }

        let raw = attrs[kSecAttrAccessible as String]
        let accessibility = accessibilityString(from: raw)
        let present = raw != nil
        var verdictHint = "C"
        if accessibility == "kSecAttrAccessibleWhenUnlocked" {
            verdictHint = "A"
        } else if let accessibility, !accessibility.isEmpty {
            verdictHint = "B"
        }

        call.resolve([
            "found": true,
            "service": service,
            "account": account,
            "accessibility": accessibility as Any,
            "accessibilityRawPresent": present,
            "verdictHint": verdictHint,
            "returnedSecretData": false,
            "note": "kSecReturnData=false; secret body never read",
        ])
    }

    private func normalizePath(_ path: String) -> String {
        if path.hasPrefix("file://") {
            return URL(string: path)?.path ?? path.replacingOccurrences(of: "file://", with: "")
        }
        return path
    }

    private func inspect(url: URL) -> [String: Any] {
        let fm = FileManager.default
        var result: [String: Any] = [
            "path": url.path,
            "exists": false,
            "isDirectory": false,
            "isExcludedFromBackup": "api_unavailable" as Any,
            "fileProtection": "api_unavailable" as Any,
        ]

        var isDir: ObjCBool = false
        let exists = fm.fileExists(atPath: url.path, isDirectory: &isDir)
        result["exists"] = exists
        result["isDirectory"] = isDir.boolValue
        guard exists else {
            result["isExcludedFromBackup"] = "unset"
            result["fileProtection"] = "unset"
            return result
        }

        do {
            let values = try url.resourceValues(forKeys: [
                .isExcludedFromBackupKey,
                .fileProtectionKey,
            ])
            if let excluded = values.isExcludedFromBackup {
                result["isExcludedFromBackup"] = excluded
            } else {
                result["isExcludedFromBackup"] = "unset"
            }
            if let protection = values.fileProtection {
                result["fileProtection"] = fileProtectionLabel(protection)
            } else {
                result["fileProtection"] = "unset"
            }
        } catch {
            result["isExcludedFromBackup"] = "api_unavailable"
            result["fileProtection"] = "api_unavailable"
            result["error"] = error.localizedDescription
        }

        let parent = url.deletingLastPathComponent()
        var parentResult: [String: Any] = [
            "path": parent.path,
            "exists": fm.fileExists(atPath: parent.path),
        ]
        if fm.fileExists(atPath: parent.path) {
            do {
                let values = try parent.resourceValues(forKeys: [
                    .isExcludedFromBackupKey,
                    .fileProtectionKey,
                ])
                if let excluded = values.isExcludedFromBackup {
                    parentResult["isExcludedFromBackup"] = excluded
                } else {
                    parentResult["isExcludedFromBackup"] = "unset"
                }
                if let protection = values.fileProtection {
                    parentResult["fileProtection"] = fileProtectionLabel(protection)
                } else {
                    parentResult["fileProtection"] = "unset"
                }
            } catch {
                parentResult["isExcludedFromBackup"] = "api_unavailable"
                parentResult["fileProtection"] = "api_unavailable"
            }
        } else {
            parentResult["isExcludedFromBackup"] = "unset"
            parentResult["fileProtection"] = "unset"
        }
        result["parent"] = parentResult
        return result
    }

    private func fileProtectionLabel(_ value: URLFileProtection) -> String {
        switch value {
        case .complete:
            return "NSFileProtectionComplete"
        case .completeUnlessOpen:
            return "NSFileProtectionCompleteUnlessOpen"
        case .completeUntilFirstUserAuthentication:
            return "NSFileProtectionCompleteUntilFirstUserAuthentication"
        case .none:
            return "NSFileProtectionNone"
        default:
            return String(describing: value)
        }
    }

    private func accessibilityString(from value: Any?) -> String? {
        guard let value else { return nil }
        if CFGetTypeID(value as CFTypeRef) == CFStringGetTypeID() {
            let s = value as! CFString
            if CFEqual(s, kSecAttrAccessibleWhenUnlocked) {
                return "kSecAttrAccessibleWhenUnlocked"
            }
            if CFEqual(s, kSecAttrAccessibleAfterFirstUnlock) {
                return "kSecAttrAccessibleAfterFirstUnlock"
            }
            if CFEqual(s, kSecAttrAccessibleWhenUnlockedThisDeviceOnly) {
                return "kSecAttrAccessibleWhenUnlockedThisDeviceOnly"
            }
            if CFEqual(s, kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly) {
                return "kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly"
            }
            if CFEqual(s, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly) {
                return "kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly"
            }
            return s as String
        }
        return String(describing: value)
    }
}
