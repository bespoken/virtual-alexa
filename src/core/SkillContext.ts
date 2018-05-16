import * as uuid from "uuid";
import {AudioPlayer} from "../audioPlayer/AudioPlayer";
import {DialogManager} from "../dialog/DialogManager";
import {InteractionModel} from "../model/InteractionModel";
import {Device} from "./Device";
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
    private _apiAccessToken: string;
    private _apiEndpoint: string;
    private _device: Device;
    /** @internal */
    private _dialogManager: DialogManager;
    /** @internal */
    private _interactionModel: InteractionModel;
    private _user: User;
    private _session: SkillSession;

    /** @internal */
    public constructor(interactionModel: InteractionModel,
                       audioPlayer: AudioPlayer,
                       private _locale: string,
                       private _applicationID?: string,
    ) {
        this._apiAccessToken = "virtualAlexa.accessToken." + uuid.v4();
        this._apiEndpoint = "https://api.amazonalexa.com";
        this._audioPlayer = audioPlayer;
        this._interactionModel = interactionModel;
        this._dialogManager = new DialogManager(this);
        this._device = new Device();
        this._user = new User();
    }

    public apiAccessToken(): string {
        return this._apiAccessToken;
    }

    public apiEndpoint(): string {
        return this._apiEndpoint;
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

    /** @internal */
    public dialogManager(): DialogManager {
        return this._dialogManager;
    }

    public audioPlayer(): AudioPlayer {
        return this._audioPlayer;
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
