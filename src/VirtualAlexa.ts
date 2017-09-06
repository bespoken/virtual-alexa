import {IntentSchema} from "./IntentSchema";
import {InteractionModel} from "./InteractionModel";
import {SampleUtterances} from "./SampleUtterances";
import {SkillInteractor} from "./SkillInteractor";
import {SessionEndedReason} from "./SkillRequest";

export class VirtualAlexa {
    public static Builder(): VirtualAlexaBuilder {
        return new VirtualAlexaBuilder();
    }

    public constructor(private interactor: SkillInteractor) {}

    public endSession(): Promise<any> {
        return this.interactor.sessionEnded(SessionEndedReason.USER_INITIATED);
    }

    public intend(intentName: string, slots?: {[id: string]: string}): Promise<any> {
        return this.interactor.intended(intentName, slots);
    }

    public launch(): Promise<any> {
        return this.interactor.launched();
    }

    public utter(utterance: string): Promise<any> {
        return this.interactor.spoken(utterance);
    }

}

class VirtualAlexaBuilder {
    public _applicationID: string;
    public _intentSchema: any;
    public _sampleUtterances: any;
    public _handler: string = "index.handler";

    public applicationID(id: string): VirtualAlexaBuilder {
        this._applicationID = id;
        return this;
    }

    public handler(handlerName: string): VirtualAlexaBuilder {
        this._handler = handlerName;
        return this;
    }

    public intentSchema(json: any): VirtualAlexaBuilder {
        this._intentSchema = json;
        return this;
    }

    public sampleUtterances(utterances: any): VirtualAlexaBuilder {
        this._sampleUtterances = utterances;
        return this;
    }

    public create(): VirtualAlexa {
        const schema = IntentSchema.fromJSON(this._intentSchema);
        const utterances = SampleUtterances.fromJSON(this._sampleUtterances);
        const model = new InteractionModel(schema, utterances);
        const interactor = new SkillInteractor(this._handler, model, this._applicationID);
        const alexa = new VirtualAlexa(interactor);
        return alexa;
    }
}
