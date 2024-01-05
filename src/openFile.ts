import { Command } from "@tauri-apps/api/shell";

export async function openInVSCode(path: string) {
    const cmd = new Command("code", ["--goto", path]);
    try {
        const output = await cmd.execute();
        if (output.code !== 0) {
            console.error("Failed to open file", path, output.stderr);
            return false;
        }
    } catch (err) {
        console.error("Failed to open file", path, err);
        return false;
    }
    return true;
}
