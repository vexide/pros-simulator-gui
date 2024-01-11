import type BoltSolid from "svelte-awesome-icons/BoltSolid.svelte";

export enum DeviceSpec {
    Controller,
    Motor,
}

export function getDeviceName(spec: DeviceSpec | null) {
    switch (spec) {
        case DeviceSpec.Controller: {
            return "Controller";
        }
        case DeviceSpec.Motor: {
            return "Motor";
        }
        case null: {
            return "None";
        }
    }
}
