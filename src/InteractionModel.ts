import * as fs from "fs";
import {BuiltinSlotTypes} from "./BuiltinSlotTypes";
import {IntentSchema} from "./IntentSchema";
import {SampleUtterances} from "./SampleUtterances";
import {SlotTypes} from "./SlotTypes";

/**
 * Parses and interprets an interaction model
 * Takes in intentName schema and sample utterances from files
 * Then can take a phrase and create an intentName request based on it
 */
export class InteractionModel {

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
        const samples = SampleUtterances.fromJSON(sampleJSON);

        return new InteractionModel(schema, samples, slotTypes);
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
                       public slotTypes?: SlotTypes) {
        if (!this.slotTypes) {
            this.slotTypes = new SlotTypes([]);
        }

        this.sampleUtterances.setInteractionModel(this);
        this.slotTypes.addTypes(BuiltinSlotTypes.values());

    }

    public hasIntent(intent: string): boolean {
        return this.intentSchema.hasIntent(intent);
    }
}
