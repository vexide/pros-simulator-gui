import type BoltSolid from "svelte-awesome-icons/BoltSolid.svelte";
import type { Controller } from "./controllers.ts";

/**
 * A set of all possible port indexes.
 *
 * @remarks
 *
 * Ports indexes start at 0.
 * There are 21 port indexes.
 */
export const ports = Array.from({ length: 21 }).map((_, i) => i);

/**
 * The type of a device, e.g. motor or controller.
 *
 * @remarks
 *
 * Does not refer to any device settings or data such as the port.
 */
export enum DeviceSpec {
    /** Controller device */
    Controller,
    /** V5 Smart Motor device */
    Motor,
}

/**
 * Formats the device type into a human readable string.
 * @param spec The type of the device.
 * @returns
 * A human readable representation of the device type.
 * If the spec is null, it will make it clear to the user
 * that there is no device connected.
 */
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
    /**
     * The type of the device, e.g. motor or controller.
     */
    spec: DeviceSpec;
}

/**
 * A generic V5 smart device with a port.
 */
export abstract class SmartDevice implements Device {
    /**
     * The type of the smart device.
     *
     * @remarks
     *
     * Controllers are not smart devices so they are not considered a valid spec for this class.
     */
    abstract readonly spec: DeviceSpec;
    /**
     * The port of the smart device.
     *
     * @remarks
     *
     * This is 0-indexed so to get the user-friendly port it may be necessary to add 1.
     */
    abstract port: number;

    /**
     * Uses the spec to create a new instance of a SmartDevice, choosing the correct subclass.
     *
     * @param spec The type of device to create.
     * @param port The port to assign to the device.
     *
     * @returns A subclass of SmartDevice based on the spec.
     *
     * @throws TypeError
     * This error is thrown when the `spec` is not a smart device type.
     */
    static create(spec: DeviceSpec, port: number): SmartDevice {
        switch (spec) {
            case DeviceSpec.Controller: {
                throw new TypeError(
                    "Cannot create a controller SmartDevice instance because controllers are not smart devices.",
                );
            }
            case DeviceSpec.Motor: {
                return new MotorDevice(port);
            }
        }
    }

    /**
     * Uses {@link getDeviceName} to format the human readable name of the device.
     */
    name() {
        return getDeviceName(this.spec);
    }
}

/**
 * A V5 smart motor with a port and a direction (reversed/not reversed).
 *
 * @remarks
 *
 * Right now there's no option to choose a gear ratio.
 */
export class MotorDevice extends SmartDevice {
    override readonly spec = DeviceSpec.Motor;

    constructor(public port: number) {
        super();
    }

    reversed = false;
}

export class ControllerDevice implements Device {
    readonly spec = DeviceSpec.Controller;

    constructor(
        public controllerId: number,
        public isPartner: boolean,
    ) {}
}
