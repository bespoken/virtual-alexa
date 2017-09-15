import * as uuid from "uuid";
import {AudioPlayer} from "./AudioPlayer";
import {InteractionModel} from "./InteractionModel";
import {SkillSession} from "./SkillSession";

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
    /** @internal */
    private _interactionModel: InteractionModel;
    private _userID: string;
    private _session: SkillSession;

    /** @internal */
    public constructor(interactionModel: InteractionModel,
                       audioPlayer: AudioPlayer,
                       private _applicationID?: string) {
        this._audioPlayer = audioPlayer;
        this._interactionModel = interactionModel;
    }

    public applicationID(): string {
        // Generate an application ID if it is not set
        if (this._applicationID === undefined || this._applicationID === null) {
            this._applicationID = "amzn1.echo-sdk-ams.app." + uuid.v4();
        }
        return this._applicationID;
    }

    /** @internal */
    public interactionModel(): InteractionModel {
        return this._interactionModel;
    }

    public userID(): string {
        if (this._userID === undefined || this._userID === null) {
            this._userID = "amzn1.ask.account." + uuid.v4();
        }
        return this._userID;
    }

    public setUserID(userID: string) {
        this._userID = userID;
    }

    public accessToken(): string {
        return this._accessToken;
    }

    public setAccessToken(token: string): void {
        this._accessToken = token;
    }

    /** @internal */
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
