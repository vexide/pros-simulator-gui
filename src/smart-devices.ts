import type BoltSolid from "svelte-awesome-icons/BoltSolid.svelte";

export const ports = Array.from({ length: 21 }).map((_, i) => i);

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

    static create(spec: DeviceSpec, port: number): SmartDevice {
        switch (spec) {
            case DeviceSpec.Controller: {
                throw new Error("Not implemented");
            }
            case DeviceSpec.Motor: {
                return new MotorDevice(port);
            }
        }
    }

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
