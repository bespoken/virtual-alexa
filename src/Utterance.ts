/**
 * Turns a phrase into an intent
 */
import {InteractionModel} from "./InteractionModel";
import {SamplePhrase} from "./SampleUtterances";

export class Utterance {
    public matchedSample: SamplePhrase;
    private slots: string[];

    public constructor(public interactionModel: InteractionModel, public phrase: string) {
        this.phrase = phrase.toLowerCase();
        this.matchIntent();
    }

    public intent(): string {
        return this.matched() ? this.matchedSample.intent : undefined;
    }

    public matched(): boolean {
        return this.matchedSample !== undefined;
    }

    public slot(index: number): string | undefined {
        if (!this.slots || index >= this.slots.length) {
            return undefined;
        }

        return this.slots[index].trim();
    }

    public slotByName(name: string): string | undefined {
        let slotValue;
        for (let i = 0; i < this.matchedSample.slotCount(); i++) {
            const slotName = this.matchedSample.slotName(i);
            if (slotName.toLowerCase() === name.toLowerCase()) {
                slotValue = this.slots[i].trim();
                break;
            }
        }
        return slotValue;
    }

    public toJSON(): any {
        const json: any = {};
        if (this.slots) {
            for (let i = 0; i < this.slots.length; i++) {
                const slotName = this.matchedSample.slotName(i);
                json[slotName] = this.slot(i);
            }
        }
        return json;
    }

    private matchIntent(): void {
        const matches = [];
        for (const intent of this.interactionModel.intentSchema.intents()) {
            const intentName = intent.name;
            for (const sample of this.interactionModel.sampleUtterances.samplesForIntent(intentName)) {
                const sampleTest = sample.matchesUtterance(this.phrase);
                if (sampleTest.matches()) {
                    matches.push(sampleTest);
                }
            }
        }

        if (matches.length > 0) {
            let topMatch;
            for (const match of matches) {
                if (!topMatch || match.score() > topMatch.score()) {
                    topMatch = match;
                } else if (topMatch.score() === match.score()) {
                    // If the scores are the same, check to see which has more specific slots
                    if (match.scoreSlots() > topMatch.scoreSlots()) {
                        topMatch = match;
                    }
                }
            }
            this.matchedSample = topMatch.samplePhrase;
            this.slots = topMatch.slotValues();
        }
    }
}
