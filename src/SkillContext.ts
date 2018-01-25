import * as uuid from "uuid";
import {AudioPlayer} from "./AudioPlayer";
import {Device} from "./Device";
import {InteractionModel} from "./InteractionModel";
import {SkillSession} from "./SkillSession";
import {User} from "./User";

/**
 * Manages state of the Alexa device interaction across sessions.
 *
 * Holds information about the user, the current session, as well as the AudioPlayer, if in use.
 *
 * To emulate a user with a linked account, set the access token property.
 */
export class SkillContext {
    /** @internal */
    private _audioPlayer: AudioPlayer;
    private _accessToken: string = null;
    private _device: Device;
    /** @internal */
    private _interactionModel: InteractionModel;
    private _user: User;
    private _session: SkillSession;

    /** @internal */
    public constructor(interactionModel: InteractionModel,
                       audioPlayer: AudioPlayer,
                       private _locale: string,
                       private _applicationID?: string
    ) {
        this._audioPlayer = audioPlayer;
        this._interactionModel = interactionModel;
        this._device = new Device();
        this._user = new User();
    }

    public applicationID(): string {
        // Generate an application ID if it is not set
        if (this._applicationID === undefined || this._applicationID === null) {
            this._applicationID = "amzn1.echo-sdk-ams.app." + uuid.v4();
        }
        return this._applicationID;
    }

    public device(): Device {
        return this._device;
    }

    /** @internal */
    public interactionModel(): InteractionModel {
        return this._interactionModel;
    }

    public user(): User {
        return this._user;
    }

    public accessToken(): string {
        return this._accessToken;
    }

    public setAccessToken(token: string): void {
        this._accessToken = token;
    }

    public locale(): string {
        return this._locale ? this._locale : "en-US";
    }

    public audioPlayer(): AudioPlayer {
        return this._audioPlayer;
    }

    public audioPlayerEnabled(): boolean {
        return this._audioPlayer !== null;
    }

    public newSession(): void {
        this._session = new SkillSession();
    }

    public session(): SkillSession {
        return this._session;
    }

    public endSession(): void {
        this._session = undefined;
    }

    public activeSession(): boolean {
        return this._session !== undefined;
    }
}
