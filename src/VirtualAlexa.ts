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
    public _intentSchemaFile: string;
    public _interactionModel: string;
    public _interactionModelFile: string;
    public _sampleUtterances: any;
    public _sampleUtterancesFile: string;
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

    public interactionModel(json: any): VirtualAlexaBuilder {
        this._interactionModel = json;
        return this;
    }

    public interactionModelFile(filePath: string): VirtualAlexaBuilder {
        this._interactionModelFile = filePath;
        return this;
    }

    public intentSchemaFile(filePath: any): VirtualAlexaBuilder {
        this._intentSchemaFile = filePath;
        return this;
    }

    public sampleUtterances(utterances: any): VirtualAlexaBuilder {
        this._sampleUtterances = utterances;
        return this;
    }

    public sampleUtterancesFile(filePath: string): VirtualAlexaBuilder {
        this._sampleUtterancesFile = filePath;
        return this;
    }

    public create(): VirtualAlexa {
        let model;
        if (this._interactionModel) {
            model = InteractionModel.fromJSON(this._interactionModel);

        } else if (this._interactionModelFile) {
            model = InteractionModel.fromFile(this._interactionModelFile);

        } else if (this._intentSchema && this._sampleUtterances) {
            const schema = IntentSchema.fromJSON(this._intentSchema);
            const utterances = SampleUtterances.fromJSON(this._sampleUtterances);
            model = new InteractionModel(schema, utterances);

        } else if (this._intentSchemaFile && this._sampleUtterancesFile) {
            const schema = IntentSchema.fromFile(this._intentSchemaFile);
            const utterances = SampleUtterances.fromFile(this._sampleUtterancesFile);
            model = new InteractionModel(schema, utterances);
        }

        const interactor = new SkillInteractor(this._handler, model, this._applicationID);
        const alexa = new VirtualAlexa(interactor);
        return alexa;
    }
}
