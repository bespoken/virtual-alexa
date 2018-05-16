import {Utterance} from "virtual-core";
import {AudioPlayer} from "../audioPlayer/AudioPlayer";
import {IResponse} from "../core/IResponse";
import {SkillContext} from "../core/SkillContext";
import {SessionEndedReason, SkillRequest} from "../core/SkillRequest";
import {SkillResponse} from "../core/SkillResponse";
import {RequestFilter} from "../core/VirtualAlexa";
import {DelegatedDialogResponse} from "../dialog/DelegatedDialogResponse";
import {ExplicitDialogResponse} from "../dialog/ExplicitDialogResponse";
import {InteractionModel} from "../model/InteractionModel";
import {UserIntent} from "./UserIntent";

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
     * @param utteranceString
     */
    public spoken(utteranceString: string): Promise<IResponse> {
        // Special handling for exit
        // Per this page:
        // https://developer.amazon.com/docs/custom-skills/request-types-reference.html#sessionendedrequest
        if (utteranceString === "exit") {
            return this.sessionEnded(SessionEndedReason.USER_INITIATED);
        }

        // First give the dialog manager a shot at it
        const intent = this.context().dialogManager().handleUtterance(utteranceString);
        if (intent) {
            return this.handleIntent(intent);
        }

        let utterance = new Utterance(this.interactionModel(), utteranceString);
        // If we don't match anything, we use the default utterance - simple algorithm for this
        if (!utterance.matched()) {
            const defaultPhrase = this.interactionModel().sampleUtterances.defaultUtterance();
            utterance = new Utterance(this.interactionModel(), defaultPhrase.phrase);
            console.warn("No intentName matches utterance: " + utteranceString
                + ". Using fallback utterance: " + defaultPhrase.phrase);
        }

        return this.handleIntent(new UserIntent(this.context(), utterance.intent(), utterance.toJSON()));
    }

    /**
     * Passes in an Display.ElementSelected request with the specified token
     * @param token
     */
    public async elementSelected(token: any): Promise<IResponse> {
        const serviceRequest = new SkillRequest(this.skillContext);
        serviceRequest.elementSelectedRequest(token);
        return this.callSkill(serviceRequest);
    }

    public launched(): Promise<any> {
        const serviceRequest = new SkillRequest(this.skillContext);
        serviceRequest.launchRequest();
        return this.callSkill(serviceRequest);
    }

    public sessionEnded(sessionEndedReason: SessionEndedReason,
                        errorData?: any): Promise<IResponse> {
        if (sessionEndedReason === SessionEndedReason.ERROR) {
            console.error("SessionEndedRequest:\n" + JSON.stringify(errorData, null, 2));
        }

        const serviceRequest = new SkillRequest(this.skillContext);
        // Convert to enum value and send request
        serviceRequest.sessionEndedRequest(sessionEndedReason, errorData);
        this.callSkill(serviceRequest);
        this.context().endSession();
        return Promise.resolve({});
    }

    /**
     * Passes in an intent with slots as a simple JSON map: {slot1: "value", slot2: "value2", etc.}
     * @param intentName
     * @param slots
     */
    public async intended(intentName: string, slots?: {[id: string]: string}): Promise<IResponse> {
        return this.handleIntent(new UserIntent(this.context(), intentName, slots));
    }

    public filter(requestFilter: RequestFilter): void {
        this.requestFilter = requestFilter;
    }

    public async callSkill(serviceRequest: SkillRequest): Promise<IResponse> {
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
            // If we have a dialog response return that instead with a reference to the skill response
            const dialogResponse = this.context().dialogManager().handleDirective(result);
            if (dialogResponse && dialogResponse.isDelegated()) {
                (dialogResponse as DelegatedDialogResponse).skillResponse = new SkillResponse(result);
                return dialogResponse;
            }
        }

        return new SkillResponse(result);
    }

    protected abstract invoke(requestJSON: any): Promise<any>;

    private async handleIntent(intent: UserIntent): Promise<IResponse> {
        // First give the dialog manager a shot at it
        const dialogResponse = this.context().dialogManager().handleIntent(intent);
        if (dialogResponse) {
            if (dialogResponse.isDelegated()) {
                return Promise.resolve(dialogResponse);
            } else {
                intent = (dialogResponse as ExplicitDialogResponse).transformedIntent;
            }
        }

        // When the user utters an intent, we suspend for it
        // We do this first to make sure everything is in the right state for what comes next
        if (this.skillContext.device().audioPlayerSupported() && this.skillContext.audioPlayer().isPlaying()) {
            this.skillContext.audioPlayer().suspend();
        }

        // Now we generate the service request
        //  The request is built based on the state from the previous step, so important that it is suspended first
        const serviceRequest = new SkillRequest(this.skillContext).intentRequest(intent);

        const result = await this.callSkill(serviceRequest);
        if (this.skillContext.device().audioPlayerSupported() && this.skillContext.audioPlayer().suspended()) {
            this.skillContext.audioPlayer().resume();
        }
        return result;
    }

    // Helper method for getting interaction model
    private interactionModel(): InteractionModel {
        return this.context().interactionModel();
    }
}
