import * as uuid from "uuid";
import * as _ from "lodash";
import {AudioPlayerActivity} from "../audioPlayer/AudioPlayer";
import {SlotValue} from "../impl/SlotValue";
import {SkillContext} from "./SkillContext";
import { ConfirmationStatus, DialogState } from "../dialog/DialogManager";
import { request } from "https";
import { SkillResponse } from "./SkillResponse";
import { VirtualAlexa } from "./VirtualAlexa";


export class RequestType {
    public static CONNECTIONS_RESPONSE = "Connections.Response";
    public static DISPLAY_ELEMENT_SELECTED_REQUEST = "Display.ElementSelected";
    public static INTENT_REQUEST = "IntentRequest";
    public static LAUNCH_REQUEST = "LaunchRequest";
    public static SESSION_ENDED_REQUEST = "SessionEndedRequest";
    public static AUDIO_PLAYER_PLAYBACK_FINISHED = "AudioPlayer.PlaybackFinished";
    public static AUDIO_PLAYER_PLAYBACK_NEARLY_FINISHED = "AudioPlayer.PlaybackNearlyFinished";
    public static AUDIO_PLAYER_PLAYBACK_STARTED = "AudioPlayer.PlaybackStarted";
    public static AUDIO_PLAYER_PLAYBACK_STOPPED = "AudioPlayer.PlaybackStopped";
}

export enum SessionEndedReason {
    ERROR,
    EXCEEDED_MAX_REPROMPTS,
    USER_INITIATED,
}

/**
 * Creates a the JSON for a Service Request programmatically
 * 
 * This class assists with setting all the values on the request.
 * 
 * Additionally, the raw JSON can be accessed with the .json() property.
 */
export class SkillRequest {


    /**
     * The timestamp is a normal JS timestamp without the milliseconds
     */
    private static timestamp() {
        const timestamp = new Date().toISOString();
        return timestamp.substring(0, 19) + "Z";
    }

    private static requestID() {
        return "amzn1.echo-external.request." + uuid.v4();
    }

    private context: SkillContext;
    private _json: any;
    
    public constructor(private alexa: VirtualAlexa) {
        this.context = alexa.context();
        this._json = this.baseRequest();
    }

    /**
     * Creates an AudioPlayer request type 
     * @param requestType One the of the AudioPlayer RequestTypes
     * @param token 
     * @param offsetInMilliseconds 
     */
    public audioPlayer(requestType: string, token: string, offsetInMilliseconds: number): SkillRequest {
        this.requestType(requestType);
        this._json.request.token = token;
        this._json.request.offsetInMilliseconds = offsetInMilliseconds;
        return this;
    }

    /** 
     * Creates a connection response object - used by Alexa Connections such as In-Skill Purchases
     * @param requestName
     * @param payload The payload object
     * @param token The correlating token
     * @param statusCode The status code
     * @param statusMessage The status message
     */
    public connectionsResponse(requestName: string, payload: any, token: string, statusCode = 200, statusMessage = "OK") {
        this.requestType(RequestType.CONNECTIONS_RESPONSE);
        this._json.request.name = requestName
        this._json.request.payload = payload
        this._json.request.token = token
        this._json.request.status = {
            code: statusCode,
            message: statusMessage
        }
        return this;
    }

    /**
     * Sets the dialog state for the request, as well as the internal dialog manager
     * @param state The dialog state
     */
    public dialogState(state: DialogState): SkillRequest {
        this.context.dialogManager().state(state);
        this._json.request.dialogState = state; 
        return this;
    }

    /**
     * Creates a Display.ElementSelected request
     * @param token The token for the selected element
     */
    public elementSelected(token: any): SkillRequest {
        this.requestType(RequestType.DISPLAY_ELEMENT_SELECTED_REQUEST);
        this._json.request.token = token;
        return this;
    }

    public inSkillPurchaseResponse(requestName: string, 
        purchaseResult: string, 
        productId: string, 
        token: string, 
        statusCode = 200,
        statusMessage = "OK") {
        return this.connectionsResponse(requestName, 
            {
                productId,
                purchaseResult,
            }, 
            token, 
            statusCode, 
            statusMessage
        )
    }
    
    /**
     * Sets the intent for the request
     * @param intentName
     * @returns {SkillRequest}
     */
    public intent(intentName: string, confirmationStatus: ConfirmationStatus = ConfirmationStatus.NONE): SkillRequest {
        this.requestType(RequestType.INTENT_REQUEST);
        const isBuiltin = intentName.startsWith("AMAZON");
        if (!isBuiltin) {
            if (!this.context.interactionModel().hasIntent(intentName)) {
                throw new Error("Interaction model has no intentName named: " + intentName);
            }
        }

        this._json.request.intent = {
            confirmationStatus: confirmationStatus,
            name: intentName,
            slots: {},
        };

        // Set default slot values - all slots must have a value for an intent
        const intent = this.context.interactionModel().intentSchema.intent(intentName);
        const intentSlots = intent.slots;
        
        if (intentSlots) {
            for (const intentSlot of intentSlots) {
                this._json.request.intent.slots[intentSlot.name] = {
                    name: intentSlot.name,
                    confirmationStatus: ConfirmationStatus.NONE
                }
            }
        }

        if (this.context.interactionModel().dialogIntent(intentName)) {
            //Update the internal state of the dialog manager based on this request
            this.context.dialogManager().handleRequest(this);

            // Our slots can just be taken from the dialog manager now
            //  It has the complete current state of the slot values for the dialog intent
            this.json().request.intent.slots = this.context.dialogManager().slots();
        }

        return this;
    }

    /**
     * Sets the confirmation status of the intent
     * @param confirmationStatus The confirmation status of the intent
     */
    public intentStatus(confirmationStatus: ConfirmationStatus): SkillRequest {
        this._json.request.intent.confirmationStatus = confirmationStatus;
        return this;
    }

    /**
     * The raw JSON of the request. This can be directly manipulated to modify what is sent to the skill.
     */
    public json(): any {
        return this._json;
    }

    /**
     * Creates a LaunchRequest request
     */
    public launch(): SkillRequest {
        this.requestType(RequestType.LAUNCH_REQUEST);
        return this;
    }

    /** @internal */
    public requiresSession(): boolean {
        // LaunchRequests and IntentRequests both require a session
        // We also force a session on a session ended request, as if someone requests a session end
        //  we will make one first if there is not. It will then be ended.
        return (this._json.request.type === RequestType.LAUNCH_REQUEST
            || this._json.request.type === RequestType.DISPLAY_ELEMENT_SELECTED_REQUEST
            || this._json.request.type === RequestType.INTENT_REQUEST
            || this._json.request.type === RequestType.SESSION_ENDED_REQUEST);
    }

    public requestType(requestType: string): SkillRequest {
        this._json.request.type = requestType;

        // If we have a session, set the info
        if (this.requiresSession()) {
            // Create a new session if there is not one
            if (!this.context.activeSession()) {
                this.context.newSession();
            }
            const applicationID = this.context.applicationID();

            const session = this.context.session();
            const newSession = session.isNew();
            const sessionID = session.id();
            const attributes = session.attributes();

            this._json.session = {
                application: {
                    applicationId: applicationID,
                },
                new: newSession,
                sessionId: sessionID,
                user: this.userObject(this.context),
            };

            if (this._json.request.type !== RequestType.LAUNCH_REQUEST) {
                this._json.session.attributes = attributes;
            }

            if (this.context.accessToken() !== null) {
                this._json.session.user.accessToken = this.context.accessToken();
            }
        }


        // For intent, launch and session ended requests, send the audio player state if there is one
        if (this.requiresSession()) {
            if (this.context.device().audioPlayerSupported()) {
                const activity = AudioPlayerActivity[this.context.audioPlayer().playerActivity()];
                this._json.context.AudioPlayer = {
                    playerActivity: activity,
                };

                // Anything other than IDLE, we send token and offset
                if (this.context.audioPlayer().playerActivity() !== AudioPlayerActivity.IDLE) {
                    const playing = this.context.audioPlayer().playing();
                    this._json.context.AudioPlayer.token = playing.stream.token;
                    this._json.context.AudioPlayer.offsetInMilliseconds = playing.stream.offsetInMilliseconds;
                }
            }
        }
        return this;
    }
    
    /**
     * Creates a SessionEndedRequest request
     * @param reason The reason the session ended
     * @param errorData Error data, if any
     */
    public sessionEnded(reason: SessionEndedReason, errorData?: any): SkillRequest {
        this.requestType(RequestType.SESSION_ENDED_REQUEST);
        this._json.request.reason = SessionEndedReason[reason];
        if (errorData !== undefined && errorData !== null) {
            this._json.request.error = errorData;
        }
        return this;
    }

    /**
     * Convenience method to set properties on the request object - uses [lodash set]{@link https://lodash.com/docs/#set} under the covers.
     * Returns this for chaining
     * @param path The dot-notation path for the property to set
     * @param value The value to set it to
     */
    set(path: string, value: any): SkillRequest {
        _.set(this.json(), path, value);
        return this;
    }

    /**
     * Sets a slot value on the request
     * @param slotName 
     * @param slotValue 
     * @param confirmationStatus 
     */
    public slot(slotName: string, slotValue: string, confirmationStatus: ConfirmationStatus = ConfirmationStatus.NONE): SkillRequest {
        const intent = this.context.interactionModel().intentSchema.intent(this.json().request.intent.name);

        const intentSlots = intent.slots;
        if (!intentSlots) {
            throw new Error("Trying to add slot to intent that does not have any slots defined");
        }

        if (!intent.slotForName(slotName)) {
            throw new Error("Trying to add undefined slot to intent: " + slotName);   
        }
            
        const slotValueObject = new SlotValue(slotName, slotValue, confirmationStatus);
        slotValueObject.setEntityResolution(this.context, this._json.request.intent.name);
        this._json.request.intent.slots[slotName] = slotValueObject;
        
        if (this.context.interactionModel().dialogIntent(this._json.request.intent.name)) {
            //Update the internal state of the dialog manager based on this request
            this.context.dialogManager().updateSlot(slotName, slotValueObject);
        }

        return this;
    }

    /**
     * Sends the request to the Alexa skill
     */
    public send(): Promise<SkillResponse> {
        return this.alexa.call(this);
    }

    /**
     * Sets slot values as a dictionary of strings on the request
     */
    public slots(slots: {[id: string]: string}): SkillRequest {
        if (slots) {
            for (const slot of Object.keys(slots)) {
                const slotValue = slots[slot];
                this.slot(slot, slotValue);
            }    
        }
        return this;
    }

    /**
     * For dialogs, updates the confirmation status of a slot - does not change the value
     * @param slotName 
     * @param confirmationStatus 
     */
    public slotStatus(slotName: string, confirmationStatus: ConfirmationStatus): SkillRequest {
        this.context.dialogManager().slots()[slotName].confirmationStatus = confirmationStatus;
        return this;
    }

    private baseRequest(): any {
        const applicationID = this.context.applicationID();
        const requestID = SkillRequest.requestID();
        const timestamp = SkillRequest.timestamp();

        // First create the header part of the request
        const baseRequest: any = {
            context: {
                System: {
                    application: {
                        applicationId: applicationID,
                    },
                    device: {
                        supportedInterfaces: this.context.device().supportedInterfaces(),
                    },
                    user: this.userObject(this.context),
                },
            },
            request: {
                locale: this.context.locale(),
                requestId: requestID,
                timestamp,
            },
            version: "1.0",
        };

        // If the device ID is set, we set the API endpoint and deviceId properties
        if (this.context.device().id()) {
            baseRequest.context.System.apiAccessToken = this.context.apiAccessToken();
            baseRequest.context.System.apiEndpoint = this.context.apiEndpoint();
            baseRequest.context.System.device.deviceId = this.context.device().id();
        }

        if (this.context.accessToken() !== null) {
            baseRequest.context.System.user.accessToken = this.context.accessToken();
        }

        // If display enabled, we add a display object to context
        if (this.context.device().displaySupported()) {
            baseRequest.context.Display = {};
        }
        return baseRequest;
    }

    private userObject(context: SkillContext): any {
        const o: any = {
            userId: context.user().id(),
        };

        // If we have a device ID, means we have permissions enabled and a consent token
        if (context.device().id()) {
            o.permissions = {
                consentToken: uuid.v4(),
            };
        }
        return o;
    }
}
