import * as uuid from "uuid";

export class Device {
    private _id: string;
    private _supportedInterfaces: any = {};

    /** @internal */
    public constructor(id?: string) {
        this._id = id;
        // By default, we support the AudioPlayer
        this.audioPlayerSupported(true);
    }

    public id(): string {
        return this._id;
    }

    public generatedID(): void {
        if (this._id) {
            return;
        }

        this._id = "virtualAlexa.deviceID." + uuid.v4();
    }

    public setID(id: string) {
        this._id = id;
    }

    public audioPlayerSupported(value?: boolean): boolean {
        return this.supportedInterface("AudioPlayer", value);
    }

    public displaySupported(value?: boolean): boolean {
        return this.supportedInterface("Display", value);
    }

    public videoAppSupported(value?: boolean) {
        return this.supportedInterface("VideoApp", value);
    }

    public supportedInterfaces(): any {
        return this._supportedInterfaces;
    }

    private supportedInterface(name: string, value?: boolean): boolean {
        if (value !== undefined) {
            if (value === true) {
                this._supportedInterfaces[name] = {};
            } else {
                delete this._supportedInterfaces[name];
            }
        }
        return this._supportedInterfaces[name] !== undefined;
    }

}
