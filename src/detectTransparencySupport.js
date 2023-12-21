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

export function isLinux() {
    return navigator.platform.includes("Linux");
}

export async function requiresOpaqueBackground() {
    if (isLinux()) {
        return true;
    }

    if (await isWindows10()) {
        return true;
    }

    return false;
}
