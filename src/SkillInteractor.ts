import {AudioPlayer} from "./AudioPlayer";
import {InteractionModel} from "./InteractionModel";
import {ModuleInvoker} from "./ModuleInvoker";
import {SkillContext} from "./SkillContext";
import {SessionEndedReason, SkillRequest} from "./SkillRequest";
import {Utterance} from "./Utterance";
import {RequestFilter} from "./VirtualAlexa";

type AlexaResponseCallback = (error: any, response: any, request: any) => void;

export enum AlexaEvent {
    SessionEnded,
    SkillError,
    SkillResponse,
}

/**
 * SkillInteractor comes in two flavors:
 *  {@link LocalSkillInteractor} - works with a local Lambda file
 *  {@link RemoteSkillInteractor} - works with a skill via HTTP calls to a URL
 *
 *  The core behavior is the same, sub-classes just implement the {@link SkillInteractor.invoke} routine
 */
export abstract class SkillInteractor {
    protected requestFilter: RequestFilter = null;
    protected skillContext: SkillContext = null;

    public constructor(protected model: InteractionModel, locale: string, applicationID?: string) {
        const audioPlayer = new AudioPlayer(this);
        this.skillContext = new SkillContext(this.model, audioPlayer, locale, applicationID);
        this.skillContext.newSession();
    }

    public context(): SkillContext {
        return this.skillContext;
    }

    /**
     * Calls the skill with specified phrase
     * Hits the callback with the JSON payload from the response
     * @param utterance
     * @param callback
     */
    public spoken(utteranceString: string): Promise<any> {
        let utterance = new Utterance(this.interactionModel(), utteranceString);

        // If we don't match anything, we use the default utterance - simple algorithm for this
        if (!utterance.matched()) {
            const defaultPhrase = this.interactionModel().sampleUtterances.defaultUtterance();
            utterance = new Utterance(this.interactionModel(), defaultPhrase.phrase);
            console.warn("No intentName matches utterance: " + utteranceString
                + ". Using fallback utterance: " + defaultPhrase.phrase);
        }

        return this.callSkillWithIntent(utterance.intent(), utterance.toJSON());
    }

    public launched(): Promise<any> {
        const serviceRequest = new SkillRequest(this.skillContext);
        serviceRequest.launchRequest();
        return this.callSkill(serviceRequest);
    }

    public sessionEnded(sessionEndedReason: SessionEndedReason,
                        errorData?: any): Promise<any> {
        if (sessionEndedReason === SessionEndedReason.ERROR) {
            console.error("SessionEndedRequest:\n" + JSON.stringify(errorData, null, 2));
        }

        const serviceRequest = new SkillRequest(this.skillContext);
        // Convert to enum value and send request
        serviceRequest.sessionEndedRequest(sessionEndedReason, errorData);
        return this.callSkill(serviceRequest).then(() => {
            this.context().endSession();
        });
    }

    /**
     * Passes in an intent with slots as a simple JSON map: {slot1: "value", slot2: "value2", etc.}
     * @param intentName
     * @param slots
     */
    public async intended(intentName: string, slots?: any): Promise<any> {
        return this.callSkillWithIntent(intentName, slots);
    }

    public filter(requestFilter: RequestFilter): void {
        this.requestFilter = requestFilter;
    }

    public async callSkill(serviceRequest: SkillRequest): Promise<any> {
        // Call this at the last possible minute, because of state issues
        //  What can happen is this gets queued, and then another request ends the session
        //  So we want to wait until just before we send this to create the session
        // This ensures it is in the proper state for the duration
        if (serviceRequest.requiresSession() && !this.context().activeSession()) {
            this.context().newSession();
        }

        const requestJSON = serviceRequest.toJSON();
        if (this.requestFilter) {
            this.requestFilter(requestJSON);
        }

        const result: any = await this.invoke(requestJSON);

        if (this.context().activeSession()) {
            this.context().session().used();
            if (result && result.response && result.response.shouldEndSession) {
                this.context().endSession();
            } else {
                this.context().session().updateAttributes(result.sessionAttributes);
            }
        }

        if (result.response !== undefined && result.response.directives !== undefined) {
            this.context().audioPlayer().directivesReceived(result.response.directives);
        }

        return result;
    }

    protected abstract invoke(requestJSON: any): Promise<any>;

    private async callSkillWithIntent(intentName: string, slots?: any, requestFilter?: RequestFilter): Promise<any> {
        // When the user utters an intent, we suspend for it
        // We do this first to make sure everything is in the right state for what comes next
        if (this.skillContext.audioPlayerEnabled() && this.skillContext.audioPlayer().isPlaying()) {
            this.skillContext.audioPlayer().suspend();
        }

        // Now we generate the service request
        //  The request is built based on the state from the previous step, so important that it is suspended first
        const serviceRequest = new SkillRequest(this.skillContext).intentRequest(intentName);
        if (slots !== undefined && slots !== null) {
            for (const slotName of Object.keys(slots)) {
                serviceRequest.withSlot(slotName, slots[slotName]);
            }
        }

        const result = await this.callSkill(serviceRequest);
        if (this.skillContext.audioPlayerEnabled() && this.skillContext.audioPlayer().suspended()) {
            this.skillContext.audioPlayer().resume();
        }
        return result;
    }

    // Helper method for getting interaction model
    private interactionModel(): InteractionModel {
        return this.context().interactionModel();
    }
}
