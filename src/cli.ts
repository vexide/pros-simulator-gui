import { invoke } from "@tauri-apps/api/tauri";

interface Args {
    workspace?: string;
    code?: string;
}

const args = invoke<Args>("get_args");

export default function cliArgs() {
    return args;
}
