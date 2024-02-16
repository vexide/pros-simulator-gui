/**
 * Platform-specific detectors to decide if the current platform requires an opaque body element background.
 *
 * @module
 */

/** Detects if the simulator is running on Windows 10 or below. */
export async function isWindows10() {
    try {
        const ua = await navigator.userAgentData.getHighEntropyValues([
            "platformVersion",
        ]);
        if (navigator.userAgentData.platform === "Windows") {
            try {
                const majorPlatformVersion = parseInt(
                    ua.platformVersion.split(".")[0],
                );
                if (majorPlatformVersion >= 13) {
                    return false;
                } else {
                    return true;
                }
            } catch {
                return true;
            }
        } else {
            return false;
        }
    } catch {
        return false;
    }
}

/** Detects if the simulator is running on Linux. */
export function isLinux() {
    return navigator.platform.includes("Linux");
}

/**
 * Detects if the current platform requires an opaque window background
 * because it does not have support for window vibrancy.
 * On Windows this is called Mica.
 *
 * - Linux: Opaque background (true)
 * - Windows v10: Opaque background (true)
 * - Windows >= v11: Mica background (false)
 * - macOS: Vibrant background (false)
 *
 * Windows 10 technically supports Acrylic vibrancy, but I had extreme performance issues with it.
 */
export async function requiresOpaqueBackground() {
    if (isLinux()) {
        return true;
    }

    if (await isWindows10()) {
        return true;
    }

    return false;
}
