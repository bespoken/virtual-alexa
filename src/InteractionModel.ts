import * as fs from "fs";
import {IModel, SampleUtterances, SlotTypes} from "virtual-core";
import {BuiltinSlotTypes} from "./BuiltinSlotTypes";
import {BuiltinUtterances} from "./BuiltinUtterances";
import {DialogIntent} from "./DialogIntent";
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
        const data = fs.readFileSync(interactionModelFile);
        const json = JSON.parse(data.toString());
        return InteractionModel.fromJSON(json);
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
        // For the official interaction model that is part of SMAPI,
        //  we pull the data off of the interactionModel.languageModel element
        if ("interactionModel" in interactionModel) {
            languageModel = interactionModel.interactionModel.languageModel;
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
        if (interactionModel.prompts) {
            prompts = [];
            for (const prompt of interactionModel.prompts) {
                prompts.push(SlotPrompt.fromJSON(prompt));
            }
        }

        let dialogIntents;
        if (interactionModel.dialog) {
            dialogIntents = [];
            for (const dialogIntent of interactionModel.dialog.intents) {
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
        // We add each phrase one-by-one
        // It is possible the built-ins have additional samples defined
        for (const key of Object.keys(builtinValues)) {
            if (this.hasIntent(key)) {
                for (const phrase of builtinValues[key]) {
                    this.sampleUtterances.addSample(key, phrase);
                }
            }
        }

        this.slotTypes.addTypes(BuiltinSlotTypes.values());
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
}
