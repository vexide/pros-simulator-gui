import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { readable, readonly, writable } from "svelte/store";
import type { ArrayValues } from "type-fest";

export const gamepadAnalog = ["LeftX", "LeftY", "RightX", "RightY"] as const;
/**
 * Represents the analog inputs of a gamepad.
 * Possible values are "LeftX", "LeftY", "RightX", and "RightY".
 */
export type GamepadAnalog = ArrayValues<typeof gamepadAnalog>;

export const gamepadDigital = [
    "L1",
    "L2",
    "R1",
    "R2",
    "Up",
    "Down",
    "Left",
    "Right",
    "X",
    "B",
    "Y",
    "A",
] as const;

/**
 * Represents the digital buttons on a gamepad.
 */
export type GamepadDigital = ArrayValues<typeof gamepadDigital>;

interface GamepadEvent {
    id: number;
    name: string;
    uuid: number[];
    update:
        | { Analog: { name: GamepadAnalog; state: number } }
        | { Digital: { name: GamepadDigital; state: boolean } }
        | "Connected"
        | "Disconnected";
}

/**
 * A PROS game controller; This doesn't have to actually be VEX hardware.
 */
export class Controller {
    id: number;
    name: string;
    uuid: number[];
    analog = new Map<GamepadAnalog, number>();
    digital = new Map<GamepadDigital, boolean>();

    constructor(event: GamepadEvent) {
        this.id = event.id;
        this.name = event.name;
        this.uuid = event.uuid;
        this.update(event);
    }

    /**
     * Updates the controller state based on the provided GamepadEvent.
     * @param {GamepadEvent} event - The GamepadEvent containing the controller update.
     */
    update(event: GamepadEvent) {
        if (typeof event.update === "object") {
            if ("Analog" in event.update) {
                this.analog.set(
                    event.update.Analog.name,
                    event.update.Analog.state,
                );
            } else if ("Digital" in event.update) {
                this.digital.set(
                    event.update.Digital.name,
                    event.update.Digital.state,
                );
            }
        }
    }
}

const controllers = writable<(Controller | null)[]>([]);

listen<GamepadEvent>("gamepad", ({ payload }) => {
    console.log(payload);
    controllers.update((state) => {
        if (payload.update === "Disconnected") {
            state[payload.id] = null;
        } else if (state[payload.id]) {
            state[payload.id]?.update(payload);
        } else {
            state[payload.id] = new Controller(payload);
        }
        return state;
    });
});

invoke("connect_all_gamepads");

export default readonly(controllers);
