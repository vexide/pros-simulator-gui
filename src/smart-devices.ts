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

export interface Device {
    spec: DeviceSpec;
}

export abstract class SmartDevice implements Device {
    abstract spec: DeviceSpec;
    abstract port: number;

    name() {
        return getDeviceName(this.spec);
    }
}

export class MotorDevice extends SmartDevice {
    spec = DeviceSpec.Motor;
    constructor(public port: number) {
        super();
    }

    reversed = false;
}
