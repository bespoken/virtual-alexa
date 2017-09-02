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
        name = name.toLowerCase();

        let slotValue;
        for (let i = 0; i < this.matchedSample.slotCount(); i++) {
            const slotName = this.matchedSample.slotName(i);
            if (slotName === name) {
                slotValue = this.slots[i].trim();
                break;
            }
        }
        return slotValue;
    }

    public toJSON(): any {
        const json: any = {};
        for (let i = 0; i < this.slots.length; i++) {
            const slotName = this.matchedSample.slotName(i);
            json[slotName] = this.slot(i);
        }
        return json;
    }

    private matchIntent(): void {
        for (const intent of this.interactionModel.sampleUtterances.intents()) {
            for (const sample of this.interactionModel.sampleUtterances.samplesForIntent(intent)) {
                const slots = sample.matchesUtterance(this.phrase);
                if (slots) {
                    this.matchedSample = sample;
                    this.slots = slots;
                }
            }

            if (this.matchedSample) {
                break;
            }
        }
    }
}
