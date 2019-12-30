import * as fs from "fs";
import {IModel, SampleUtterances, SlotTypes} from "virtual-core";
import {DialogIntent} from "../dialog/DialogIntent";
import {BuiltinSlotTypes} from "./BuiltinSlotTypes";
import {AudioPlayerIntents, BuiltinUtterances} from "./BuiltinUtterances";
import {IntentSchema} from "./IntentSchema";
import {SampleUtterancesBuilder} from "./SampleUtterancesBuilder";
import {SlotPrompt} from "./SlotPrompt";

/**
 * Parses and interprets an interaction model
 * Takes in intentName schema and sample utterances from files
 * Then can take a phrase and create an intentName request based on it
 */
export class InteractionModel implements IModel {

    // Parse the all-in-one interaction model as a file
    public static fromFile(interactionModelFile: any): InteractionModel {
        try {
            const data = fs.readFileSync(interactionModelFile);
            const json = JSON.parse(data.toString());
            return InteractionModel.fromJSON(json);
        } catch (error) {
            if (error.message.includes("ENOENT")) {
                throw new Error("The interaction model for your Alexa Skill could not be found under:\n" +
                    interactionModelFile +
                    "\nPlease provide the correct location of the Interaction Model.")
            }
            throw error;
        }
    }

    // Parse the all-in-one interaction model as JSON
    // Using this for reference:
    //  https://github.com/alexa/skill-sample-nodejs-team-lookup/blob/master/speech-assets/interaction-model.json
    public static fromJSON(interactionModel: any): InteractionModel {
        const schemaJSON: any = {
            intents: [],
        };
        const sampleJSON: any = {};

        let languageModel = interactionModel;
        let promptsElement = interactionModel.prompts;
        let dialogElement = interactionModel.dialog;
        // For the official interaction model that is part of SMAPI,
        //  we pull the data off of the interactionModel.languageModel element
        if ("interactionModel" in interactionModel) {
            languageModel = interactionModel.interactionModel.languageModel;
            promptsElement = interactionModel.interactionModel.prompts;
            dialogElement = interactionModel.interactionModel.dialog;
        }

        // There is another version of the model from the interaction model builder
        if ("languageModel" in interactionModel) {
            languageModel = interactionModel.languageModel;
        }

        const intents = languageModel.intents;
        for (const intent of intents) {
            // The name of the intent is on the property "name" instead of "intent" for the unified model
            intent.intent = intent.name;
            schemaJSON.intents.push(intent);
            if (intent.samples) {
                sampleJSON[intent.intent] = intent.samples;
            }
        }

        let slotTypes;
        if (languageModel.types) {
            slotTypes = new SlotTypes(languageModel.types);
        }
        const schema = new IntentSchema(schemaJSON);
        const samples = SampleUtterancesBuilder.fromJSON(sampleJSON);

        let prompts;
        if (promptsElement) {
            prompts = [];
            for (const prompt of promptsElement) {
                prompts.push(SlotPrompt.fromJSON(prompt));
            }
        }

        let dialogIntents;
        if (dialogElement) {
            dialogIntents = [];
            for (const dialogIntent of dialogElement.intents) {
                dialogIntents.push(DialogIntent.fromJSON(interactionModel, dialogIntent));
            }
        }

        return new InteractionModel(schema, samples, slotTypes, prompts, dialogIntents);
    }

    public static fromLocale(locale: string): InteractionModel {
        const modelPath = "./models/" + locale + ".json";
        if (!fs.existsSync(modelPath)) {
            return undefined;
        }

        return InteractionModel.fromFile(modelPath);
    }

    public constructor(public intentSchema: IntentSchema,
                       public sampleUtterances: SampleUtterances,
                       public slotTypes?: SlotTypes,
                       public prompts?: SlotPrompt[],
                       public dialogIntents?: DialogIntent[]) {
        if (!this.slotTypes) {
            this.slotTypes = new SlotTypes([]);
        }

        // In bootstrapping the interaction model, we pass it to its children
        this.sampleUtterances.setInteractionModel(this);

        if (this.dialogIntents) {
            for (const dialogIntent of this.dialogIntents) {
                dialogIntent.interactionModel = this;
            }
        }

        const builtinValues = BuiltinUtterances.values();

        const isAudioPlayerSupported = this.audioPlayerSupported(intentSchema);
        // We add each phrase one-by-one
        // It is possible the built-ins have additional samples defined
        for (const key of Object.keys(builtinValues)) {
            const isSupportedIntent = this.isSupportedIntent(isAudioPlayerSupported, key);
            if (isSupportedIntent) {
                intentSchema.addIntent(key);
                for (const phrase of builtinValues[key]) {
                    this.sampleUtterances.addSample(key, phrase);
                }
            }
        }

        this.slotTypes.addTypes(BuiltinSlotTypes.values());
    }
    
    public isSupportedIntent(isAudioPlayerSupported: boolean, intent: string): boolean {
        const hasIntent = this.hasIntent(intent);
        const isAudioPlayerIntent = isAudioPlayerSupported && AudioPlayerIntents.indexOf(intent) >= 0;
        return hasIntent || isAudioPlayerIntent;
    }

    public hasIntent(intent: string): boolean {
        return this.intentSchema.hasIntent(intent);
    }

    public dialogIntent(intentName: string): DialogIntent | undefined {
        if (!this.dialogIntents) {
            return undefined;
        }

        for (const dialogIntent of this.dialogIntents) {
            // If our intent matches a dialog intent, then we flip into dialog mode
            if (dialogIntent.name === intentName) {
                return dialogIntent;
            }
        }

        return undefined;
    }

    public prompt(id: string): SlotPrompt | undefined {
        if (!this.prompts) {
            return undefined;
        }

        for (const prompt of this.prompts) {
            if (prompt.id === id) {
                return prompt;
            }
        }

        return undefined;
    }

    public audioPlayerSupported(intentSchema: IntentSchema) : boolean {
        // Audio player must have pause and resume intents in the model
        return intentSchema.hasIntent("AMAZON.PauseIntent") && intentSchema.hasIntent("AMAZON.ResumeIntent");
    }
}
