import {AudioPlayer} from "./AudioPlayer";
import {IntentSchema} from "./IntentSchema";
import {InteractionModel} from "./InteractionModel";
import {LocalSkillInteractor} from "./LocalSkillInteractor";
import {RemoteSkillInteractor} from "./RemoteSkillInteractor";
import {SampleUtterances} from "./SampleUtterances";
import {SkillContext} from "./SkillContext";
import {SkillInteractor} from "./SkillInteractor";
import {SessionEndedReason} from "./SkillRequest";

export class VirtualAlexa {
    public static Builder(): VirtualAlexaBuilder {
        return new VirtualAlexaBuilder();
    }

    /** @internal */
    private interactor: SkillInteractor;

    /** @internal */
    public constructor(interactor: SkillInteractor) {
        this.interactor = interactor;
    }

    // Provides access to the AudioPlayer object, for sending audio requests
    public audioPlayer(): AudioPlayer {
        return this.interactor.context().audioPlayer();
    }

    public context(): SkillContext {
        return this.interactor.context();
    }

    public endSession(): Promise<any> {
        return this.interactor.sessionEnded(SessionEndedReason.USER_INITIATED, undefined);
    }

    /**
     * Set a filter on requests - for manipulating the payload before it is sent
     * @param {RequestFilter} requestFilter
     * @returns {VirtualAlexa}
     */
    public filter(requestFilter: RequestFilter): VirtualAlexa {
        this.interactor.filter(requestFilter);
        return this;
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

export type RequestFilter = (request: any) => void;

/**
 * Configuration object for VirtualAlexa.<br>
 * <br>
 * Callers must provide:<br>
 * 1) An interaction model or combination of intent schema and sample utterances<br>
 * These can be provided either as files or JSON<br>
 * 2) A handler name or skill URL<br>
 * The VirtualAlexa will either run a Lambda locally, or interact with a skill via HTTP<br>
 * <br>
 * Once the object is configured properly, create it by calling {@link VirtualAlexaBuilder.create}
 *
 */
export class VirtualAlexaBuilder {
    /** @internal */
    private _applicationID: string;
    /** @internal */
    private _handler: string | ((...args: any[]) => void);
    /** @internal */
    private _intentSchema: any;
    /** @internal */
    private _intentSchemaFile: string;
    /** @internal */
    private _interactionModel: string;
    /** @internal */
    private _interactionModelFile: string;
    /** @internal */
    private _sampleUtterances: any;
    /** @internal */
    private _sampleUtterancesFile: string;
    /** @internal */
    private _skillURL: string;
    /** @internal */
    private _locale: string;

    /**
     * The application ID of the skill [Optional]
     * @param {string} id
     * @returns {VirtualAlexaBuilder}
     */
    public applicationID(id: string): VirtualAlexaBuilder {
        this._applicationID = id;
        return this;
    }

    /**
     * The name of the handler, or the handler function itself, for a Lambda to be called<br>
     * The name should be in the format "index.handler" where:<br>
     * `index` is the name of the file - such as index.js<br>
     * `handler` is the name of the exported function to call on the file<br>
     * @param {string | Function} handlerName
     * @returns {VirtualAlexaBuilder}
     */
    public handler(handlerName: string | ((...args: any[]) => void)): VirtualAlexaBuilder {
        this._handler = handlerName;
        return this;
    }

    /**
     * JSON that corresponds to the intent schema<br>
     * If the intent schema is provided, a {@link VirtualAlexaBuilder.sampleUtterances} JSON must also be supplied
     * @param json
     * @returns {VirtualAlexaBuilder}
     */
    public intentSchema(json: any): VirtualAlexaBuilder {
        this._intentSchema = json;
        return this;
    }

    /**
     * Path to intent schema file<br>
     * To be provided along with {@link VirtualAlexaBuilder.sampleUtterancesFile}<br>
     * @param {string} filePath
     * @returns {VirtualAlexaBuilder}
     */
    public intentSchemaFile(filePath: any): VirtualAlexaBuilder {
        this._intentSchemaFile = filePath;
        return this;
    }

    /**
     * JSON that corresponds to the new, unified interaction model
     * @param json
     * @returns {VirtualAlexaBuilder}
     */
    public interactionModel(json: any): VirtualAlexaBuilder {
        this._interactionModel = json;
        return this;
    }

    /**
     * File path that contains to the new, unified interaction model
     * @param filePath
     * @returns {VirtualAlexaBuilder}
     */
    public interactionModelFile(filePath: string): VirtualAlexaBuilder {
        this._interactionModelFile = filePath;
        return this;
    }

    /**
     * JSON that corresponds to the sample utterances<br>
     * Provided along with {@link VirtualAlexaBuilder.intentSchema}<br>
     * The sample utterances should be in the form:
     * ```javascript
     * {
     *      "Intent": ["Sample1", "Sample2"],
     *      "IntentTwo": ["AnotherSample"]
     * }
     * ```
     * @param utterances
     * @returns {VirtualAlexaBuilder}
     */
    public sampleUtterances(utterances: any): VirtualAlexaBuilder {
        this._sampleUtterances = utterances;
        return this;
    }

    /**
     * File path to sample utterances file<br>
     * To be provided along with {@link VirtualAlexaBuilder.intentSchemaFile}<br>
     * Format is the same as in the Alexa Developer Console - a simple text file of intents and utterances
     * @param {string} filePath
     * @returns {VirtualAlexaBuilder}
     */
    public sampleUtterancesFile(filePath: string): VirtualAlexaBuilder {
        this._sampleUtterancesFile = filePath;
        return this;
    }

    /**
     * The URL of the skill to be tested
     * @param {string} url
     * @returns {VirtualAlexaBuilder}
     */
    public skillURL(url: string): VirtualAlexaBuilder {
        this._skillURL = url;
        return this;
    }

    /**
     * The Locale that is going to be tested
     * @param {string} locale
     * @returns {VirtualAlexaBuilder}
     */
    public locale(locale: string): VirtualAlexaBuilder {
        this._locale = locale;
        return this;
    }

    public create(): VirtualAlexa {
        let model;
        const locale = this._locale ? this._locale : "en-US";

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
        } else {
            model = InteractionModel.fromLocale(locale);
            if (!model) {
                throw new Error(
                    "Either an interaction model or intent schema and sample utterances must be provided.\n" +
                    "Alternatively, if you specify a locale, Virtual Alexa will automatically check for the " +
                    "interaction model under the directory \"./models\" - e.g., \"./models/en-US.json\"");
            }
        }

        let interactor;

        if (this._handler) {
            interactor = new LocalSkillInteractor(this._handler, model, locale, this._applicationID);
        } else if (this._skillURL) {
            interactor = new RemoteSkillInteractor(this._skillURL, model, locale, this._applicationID);
        } else {
            throw new Error("Either a handler or skillURL must be provided.");
        }

        return new VirtualAlexa(interactor);
    }
}
