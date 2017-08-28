/**
 * Turns a phrase into an intent
 */
import {InteractionModel} from "./InteractionModel";

export class Utterance {
    private matchedPhrase: string;
    private matchedIntent: string;

    public constructor(public interactionModel: InteractionModel, public phrase: string) {
        this.phrase = phrase.toLowerCase();
        this.matchIntent();
    }

    public intent(): string | undefined {
        return this.matchedIntent;
    }

    public matched(): boolean {
        return this.matchedIntent !== undefined;
    }

    private matchIntent(): void {
        for (const intent of this.interactionModel.sampleUtterances.intents()) {
            for (let sample of this.interactionModel.sampleUtterances.samplesForIntent(intent)) {
                sample = sample.toLowerCase();
                const regex = this.replaceSlots(sample);
                const match = this.phrase.match(regex);
                if (match !== null) {
                    this.matchedPhrase = sample;
                    this.matchedIntent = intent;
                    break;
                }
            }

            if (this.matchedPhrase) {
                break;
            }
        }
    }

    private replaceSlots(sample: string): string {
        const startIndex = sample.indexOf("{");
        if (startIndex !== -1) {
            const endIndex = sample.indexOf("}", startIndex);
            sample = sample.substring(0, startIndex) + ".*" + sample.substring(endIndex + 1);
            return this.replaceSlots(sample);
        }
        return sample;
    }
}
