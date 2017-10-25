import * as uuid from "uuid";

export class Device {
    private _id: string;
    private _supportedInterfaces: any = {};

    /** @internal */
    public constructor(id?: string) {
        this._id = id;
        this.addSupportedInterface("AudioPlayer");
    }

    public id(): string {
        return this._id;
    }

    public setID(id: string) {
        this._id = id;
    }

    public addSupportedInterface(name: string, value?: any) {
        if (!value) {
            value = {};
        }
        this._supportedInterfaces[name] = value;
    }

    public supportedInterfaces(): any {
        return this._supportedInterfaces;
    }
}
