import {IntentSchema} from "./IntentSchema";
import {SampleUtterances} from "./SampleUtterances";

/**
 * Parses and interprets an interaction model
 * Takes in intentName schema and sample utterances from files
 * Then can take a phrase and create an intentName request based on it
 */
export class InteractionModel {
    public static fromFiles(intentSchemaFile: string, sampleUtterancesFile: string): Promise<InteractionModel> {
        const intentPromise = IntentSchema.fromFile(intentSchemaFile);
        const samplePromise = SampleUtterances.fromFile(sampleUtterancesFile);
        return Promise.all([intentPromise, samplePromise]).then(([intentSchema, sampleUtterances]) => {
            return new InteractionModel(intentSchema, sampleUtterances);
        });
    }

    public constructor(public intentSchema: IntentSchema, public sampleUtterances: SampleUtterances) {}

    public hasIntent(intent: string): boolean {
        return this.intentSchema.hasIntent(intent);
    }
}
