import * as uuid from "uuid";

export class User {
    private _id: string;
    private _enablePermissions: boolean = false;

    /** @internal */
    public constructor(id?: string) {
        this._id = id;
        if (!this._id) {
            this._id = "amzn1.ask.account." + uuid.v4();
        }
    }

    public id(): string {
        return this._id;
    }

    public setID(id: string) {
        this._id = id;
    }
}
