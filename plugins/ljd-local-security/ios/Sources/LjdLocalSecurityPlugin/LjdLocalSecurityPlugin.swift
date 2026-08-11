import Foundation
import Capacitor
import Security

/**
 * Phase 4B-3B PoC bridge:
 * - SecureKeyStore with explicit kSecAttrAccessibleWhenUnlocked
 * - File backup exclusion + file protection inspection / Complete setting
 *
 * Dummy / diagnostics only. Domain layer must not import Security framework.
 */
@objc(LjdLocalSecurityPlugin)
public class LjdLocalSecurityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LjdLocalSecurityPlugin"
    public let jsName = "LjdLocalSecurity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "generateSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "existsSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "inspectPath", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setCompleteProtection", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resolveCandidatePaths", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ensureProbeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deletePath", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "inspectGenericPasswordAccessibility", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setExcludedFromBackup", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resolveApplicationSupportLjdDir", returnType: CAPPluginReturnPromise),
    ]

    private let keychainService = "app.bamboonook.ljd.securekeystore.poc"
    /// Reported Keychain accessibility constant (PoC; never log secret values).
    private let keychainAccessibilityName = "kSecAttrAccessibleWhenUnlocked"

    // MARK: - SecureKeyStore

    @objc func generateSecret(_ call: CAPPluginCall) {
        let byteCount = call.getInt("byteLength") ?? 32
        guard byteCount > 0, byteCount <= 64 else {
            call.reject("byteLength must be 1...64")
            return
        }
        var bytes = [UInt8](repeating: 0, count: byteCount)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard status == errSecSuccess else {
            call.reject("SecRandomCopyBytes failed: \(status)")
            return
        }
        let secret = Data(bytes).base64EncodedString()
        call.resolve([
            "secret": secret,
            "byteLength": byteCount,
            "encoding": "base64",
            "randomSource": "SecRandomCopyBytes",
        ])
    }

    @objc func setSecret(_ call: CAPPluginCall) {
        guard let account = call.getString("account"), !account.isEmpty else {
            call.reject("account required")
            return
        }
        guard let secret = call.getString("secret"), !secret.isEmpty else {
            call.reject("secret required")
            return
        }
        guard let data = secret.data(using: .utf8) else {
            call.reject("secret encoding failed")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked,
            kSecValueData as String: data,
        ]

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            call.reject("SecItemAdd failed: \(status)")
            return
        }
        call.resolve([
            "stored": true,
            "accessibility": keychainAccessibilityName,
            "byteLength": data.count,
        ])
    }

    @objc func getSecret(_ call: CAPPluginCall) {
        guard let account = call.getString("account"), !account.isEmpty else {
            call.reject("account required")
            return
        }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            call.resolve([
                "found": false,
                "accessibility": NSNull(),
            ])
            return
        }
        guard status == errSecSuccess,
              let existing = item as? [String: Any],
              let data = existing[kSecValueData as String] as? Data,
              let secret = String(data: data, encoding: .utf8)
        else {
            call.reject("SecItemCopyMatching failed: \(status)")
            return
        }
        let accessibility = accessibilityString(from: existing[kSecAttrAccessible as String])
        call.resolve([
            "found": true,
            "secret": secret,
            "byteLength": data.count,
            "accessibility": accessibility as Any,
        ])
    }

    @objc func existsSecret(_ call: CAPPluginCall) {
        guard let account = call.getString("account"), !account.isEmpty else {
            call.reject("account required")
            return
        }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnAttributes as String: true,
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            call.resolve(["exists": false])
            return
        }
        guard status == errSecSuccess else {
            call.reject("exists check failed: \(status)")
            return
        }
        let attrs = item as? [String: Any]
        let accessibility = accessibilityString(from: attrs?[kSecAttrAccessible as String])
        call.resolve([
            "exists": true,
            "accessibility": accessibility as Any,
        ])
    }

    @objc func deleteSecret(_ call: CAPPluginCall) {
        guard let account = call.getString("account"), !account.isEmpty else {
            call.reject("account required")
            return
        }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
        ]
        let status = SecItemDelete(query as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve(["deleted": status == errSecSuccess])
            return
        }
        call.reject("SecItemDelete failed: \(status)")
    }

    // MARK: - Path attributes

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
            // Prefer resource-value write when available (may be get-only on some SDKs).
            do {
                try (url as NSURL).setResourceValue(
                    URLFileProtection.complete,
                    forKey: .fileProtectionKey
                )
            } catch {
                // FileManager path already applied; continue.
            }
            call.resolve(inspect(url: url))
        } catch {
            call.reject("setCompleteProtection failed: \(error.localizedDescription)")
        }
    }

    @objc func resolveCandidatePaths(_ call: CAPPluginCall) {
        let fm = FileManager.default
        guard let library = fm.urls(for: .libraryDirectory, in: .userDomainMask).first,
              let documents = fm.urls(for: .documentDirectory, in: .userDomainMask).first,
              let appSupport = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
        else {
            call.reject("could not resolve standard directories")
            return
        }
        let libraryCapDb = library.appendingPathComponent("CapacitorDatabase", isDirectory: true)
        let docsDefault = documents
        let ljdSupport = appSupport.appendingPathComponent("ljd", isDirectory: true)
        let mediaRoot = library.appendingPathComponent("ljd/media/security-poc", isDirectory: true)

        call.resolve([
            "candidateA_libraryCapacitorDatabase": libraryCapDb.path,
            "candidateB_documents": docsDefault.path,
            "candidateC_applicationSupportLjd": ljdSupport.path,
            "mediaLibraryLjdSecurityPoc": mediaRoot.path,
        ])
    }

    @objc func ensureProbeFile(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.reject("path required")
            return
        }
        let url = URL(fileURLWithPath: normalizePath(path))
        let fm = FileManager.default
        do {
            try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            if !fm.fileExists(atPath: url.path) {
                try Data("LJD security PoC probe\n".utf8).write(to: url, options: .atomic)
            }
            call.resolve(inspect(url: url))
        } catch {
            call.reject("ensureProbeFile failed: \(error.localizedDescription)")
        }
    }

    @objc func deletePath(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.reject("path required")
            return
        }
        let url = URL(fileURLWithPath: normalizePath(path))
        let fm = FileManager.default
        do {
            if fm.fileExists(atPath: url.path) {
                try fm.removeItem(at: url)
                call.resolve(["deleted": true, "path": url.path])
            } else {
                call.resolve(["deleted": false, "path": url.path])
            }
        } catch {
            call.reject("deletePath failed: \(error.localizedDescription)")
        }
    }

    /**
     * Development-only Keychain attribute probe.
     * NEVER requests kSecReturnData — secret body is not retrieved.
     */
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
            // Critical: do not return secret bytes
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
        } else if !present {
            verdictHint = "C"
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

    /**
     * Explicitly set NSURLIsExcludedFromBackupKey without touching file contents.
     * Used to counter plugin createDatabaseLocation(isExcluded:true) when needed.
     */
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

    /**
     * Resolve LJD Application Support directory via Foundation (no hardcoded absolute path).
     * Subdir = Bundle.main.bundleIdentifier (Apple convention).
     */
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
            /** Relative path consumable by community sqlite iosDatabaseLocation (Library/...). */
            "pluginRelativeLocation": "Library/Application Support/\(bundleId)",
            "note": "pluginRelativeLocation is relative to container; absolute paths from FileManager only",
        ])
    }

    // MARK: - Helpers

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
            "exists": fm.fileExists(atPath: url.path),
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

        if let parent = try? url.deletingLastPathComponent() {
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
        }

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
