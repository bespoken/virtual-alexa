import * as uuid from "uuid";
import {AudioPlayerActivity} from "./AudioPlayer";
import {SkillContext} from "./SkillContext";
import {RequestFilter} from "./VirtualAlexa";

export class RequestType {
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
        return "amzn1.echo-api.request." + uuid.v4();
    }

    private requestJSON: any = null;
    private requestType: string;
    public constructor(private context: SkillContext) {}

    /**
     * Generates an intentName request with the specified IntentName
     * @param intentName
     * @returns {SkillRequest}
     */
    public intentRequest(intentName: string): SkillRequest {
        const isBuiltin = intentName.startsWith("AMAZON");
        if (!isBuiltin) {
            if (!this.context.interactionModel().hasIntent(intentName)) {
                throw new Error("Interaction model has no intentName named: " + intentName);
            }
        }

        this.requestJSON = this.baseRequest(RequestType.INTENT_REQUEST);
        this.requestJSON.request.intent = {
            name: intentName,
        };

        // Always specify slots, even if utterance does not come with them specified
        //  In that case, they just have a blank value
        if (!isBuiltin) {
            const intent = this.context.interactionModel().intentSchema.intent(intentName);
            if (intent.slots !== null && intent.slots.length > 0) {
                this.requestJSON.request.intent.slots = {};
                for (const slot of intent.slots) {
                    this.requestJSON.request.intent.slots[slot.name] = {
                        name: slot.name,
                    };
                }
            }
        }

        return this;
    }

    public audioPlayerRequest(requestType: string, token: string, offsetInMilliseconds: number): SkillRequest {
        this.requestJSON = this.baseRequest(requestType);
        this.requestJSON.request.token = token;
        this.requestJSON.request.offsetInMilliseconds = offsetInMilliseconds;
        return this;
    }

    public launchRequest(): SkillRequest {
        this.requestJSON = this.baseRequest(RequestType.LAUNCH_REQUEST);
        return this;
    }

    public sessionEndedRequest(reason: SessionEndedReason, errorData?: any): SkillRequest {
        this.requestJSON = this.baseRequest(RequestType.SESSION_ENDED_REQUEST);
        this.requestJSON.request.reason = SessionEndedReason[reason];
        if (errorData !== undefined && errorData !== null) {
            this.requestJSON.request.error = errorData;
        }
        return this;
    }

    /**
     * Adds a slot to the intentName request (it must be an intentName request)
     * @param slotName
     * @param slotValue
     * @returns {SkillRequest}
     */
    public withSlot(slotName: string, slotValue: string): SkillRequest {
        if (this.requestJSON.request.type !== "IntentRequest") {
            throw Error("Trying to add slot to non-intent request");
        }

        if (!this.requestJSON.request.intent.slots) {
            throw Error("Trying to add slot to intent that does not have any slots defined");
        }

        if (!(slotName in this.requestJSON.request.intent.slots)) {
            throw Error("Trying to add undefined slot to intent: " + slotName);
        }

        this.requestJSON.request.intent.slots[slotName] = { name: slotName, value: slotValue };
        return this;
    }

    public requiresSession(): boolean {
        // LaunchRequests and IntentRequests both require a session
        // We also force a session on a session ended request, as if someone requests a session end
        //  we will make one first if there is not. It will then be ended.
        return (this.requestType === RequestType.LAUNCH_REQUEST
            || this.requestType === RequestType.INTENT_REQUEST
            || this.requestType === RequestType.SESSION_ENDED_REQUEST);
    }

    public toJSON() {
        const applicationID = this.context.applicationID();

        // If we have a session, set the info
        if (this.requiresSession() && this.context.activeSession()) {
            const session = this.context.session();
            const newSession = session.isNew();
            const sessionID = session.id();
            const attributes = session.attributes();

            this.requestJSON.session = {
                application: {
                    applicationId: applicationID,
                },
                new: newSession,
                sessionId: sessionID,
                user: this.userObject(this.context),
            };

            if (this.requestType !== RequestType.LAUNCH_REQUEST) {
                this.requestJSON.session.attributes = attributes;
            }

            if (this.context.accessToken() !== null) {
                this.requestJSON.session.user.accessToken = this.context.accessToken();
            }
        }

        // For intent, launch and session ended requests, send the audio player state if there is one
        if (this.requiresSession()) {
            if (this.context.audioPlayerEnabled()) {
                const activity = AudioPlayerActivity[this.context.audioPlayer().playerActivity()];
                this.requestJSON.context.AudioPlayer = {
                    playerActivity: activity,
                };

                // Anything other than IDLE, we send token and offset
                if (this.context.audioPlayer().playerActivity() !== AudioPlayerActivity.IDLE) {
                    const playing = this.context.audioPlayer().playing();
                    this.requestJSON.context.AudioPlayer.token = playing.stream.token;
                    this.requestJSON.context.AudioPlayer.offsetInMilliseconds = playing.stream.offsetInMilliseconds;
                }
            }
        }

        return this.requestJSON;
    }

    private baseRequest(requestType: string): any {
        this.requestType = requestType;
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
                type: requestType,
            },
            version: "1.0",
        };

        // If the device ID is set, we set the API endpoint and deviceId properties
        if (this.context.device().id()) {
            baseRequest.context.System.apiEndpoint = "https://api.amazonalexa.com/";
            baseRequest.context.System.device.deviceId = this.context.device().id();
        }

        if (this.context.accessToken() !== null) {
            baseRequest.context.System.user.accessToken = this.context.accessToken();
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
