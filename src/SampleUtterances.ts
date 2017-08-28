import * as fs from "fs";

export class SampleUtterances {
    public static fromFile(file: string): Promise<SampleUtterances> {
        return new Promise((resolve, reject) => {
            fs.readFile(file, null, (error: NodeJS.ErrnoException, data: Buffer) => {
                if (data !== null) {
                    const sampleUtterances = new SampleUtterances();
                    sampleUtterances.parseFlatFile(data.toString());
                    resolve(sampleUtterances);
                } else {
                    reject("File not found: " + file);
                }
            });
        });
    }

    public static fromJSON(sampleUtterancesJSON: any): SampleUtterances {
        const sampleUtterances = new SampleUtterances();
        for (const intent of Object.keys(sampleUtterancesJSON)) {
            sampleUtterances.samples[intent] = sampleUtterancesJSON[intent];
        }
        return sampleUtterances;
    }

    private samples: {[id: string]: string[]} = {};

    public intents(): string[] {
        return Object.keys(this.samples);
    }

    public samplesForIntent(intent: string): string [] {
        return this.samples[intent];
    }

    /**
     * To handle the case when what is said does not match any sample utterance
     */
    public defaultUtterance(): string {
        // Just grab the first sample for now
        const firstIntent = Object.keys(this.samples)[0];
        return this.samples[firstIntent][0];
    }

    /**
     * Returns an uttered intentName tuple for the phrase
     * The uttered intentName has the intentName name and slot information
     * @param phraseString
     * @returns {UtteredIntent}
     */
    public intentForUtterance(phraseString: string): UtteredIntent {
        const phrase = new Phrase(phraseString);

        let matchedIntent: UtteredIntent = null;
        for (const intent of Object.keys(this.samples)) {
            const samples = this.samples[intent];
            for (const sample of samples) {
                if (phrase.matchesUtterance(sample)) {
                    matchedIntent = new UtteredIntent(intent, phraseString, new Phrase(sample));
                    break;
                }
            }

            if (matchedIntent !== null) {
                break;
            }
        }
        return matchedIntent;
    }

    public hasIntent(intent: string): boolean {
        return intent in this.samples;
    }

    private parseFlatFile(fileData: string): void {
        const lines = fileData.split("\n");
        for (const line of lines) {
            if (line.trim().length === 0) {
                // We skip blank lines - which is what Alexa does
                continue;
            }

            const index = line.indexOf(" ");
            if (index === -1) {
                throw Error("Invalid sample utterance: " + line);
            }

            const intent = line.substr(0, index);
            const sample = line.substr(index).trim();
            let intentSamples: string[] = [];
            if (intent in this.samples) {
                intentSamples = this.samples[intent];
            } else {
                this.samples[intent] = intentSamples;
            }

            intentSamples.push(sample);
        }
    }
}

/**
 * Helper class for handling phrases - breaks out the slots within a phrase
 */
export class Phrase {
    public slots: string[] = [];
    public normalizedPhrase: string = null;

    public constructor(public phrase: string) {
        this.normalizeSlots(this.phrase);
    }

    /**
     * Takes a phrase like "This is a {Slot}" and turns it into "This is a {}"
     * This is so we can compare the sample utterances (which have names that tie off to the slot names defined in the
     *  intent schema) with the actual utterance, which have values in the slot positions (as opposed to the names)
     * @param utterance
     */
    public normalizeSlots(utterance: string): void {
        // Slots are indicated by {braces}
        let slotlessUtterance = "";
        let index = 0;
        let done = false;
        while (!done) {
            const startSlotIndex = utterance.indexOf("{", index);
            if (startSlotIndex !== -1) {
                const endSlotIndex = utterance.indexOf("}", startSlotIndex);

                // Get the contents of the slot and put it in an array
                const slotValue = utterance.substr(startSlotIndex + 1, endSlotIndex - (startSlotIndex + 1));
                this.slots.push(slotValue);

                slotlessUtterance += utterance.substr(index, startSlotIndex - index + 1) + "}";

                index = endSlotIndex + 1;
            } else {
                slotlessUtterance += utterance.substr(index);
                done = true;
            }
        }
        this.normalizedPhrase = slotlessUtterance;
    }

    public matchesUtterance(otherPhraseString: string): boolean {
        return this.matches(new Phrase(otherPhraseString));
    }

    public matches(otherPhrase: Phrase): boolean {
        return this.normalizedPhrase.toLowerCase() === otherPhrase.normalizedPhrase.toLowerCase();
    }
}

/**
 * Object to hold tuple of intentName name, utterance, and the matched phrase
 *
 * Helpful for handling slots
 */
export class UtteredIntent {
    public constructor(public intentName: string, public utterance: string, public matchedPhrase: Phrase) {}

    public slotCount(): number {
        return this.matchedPhrase.slots.length;
    }

    public slotName(index: number) {
        return this.matchedPhrase.slots[index];
    }

    public slotValue(index: number) {
        return new Phrase(this.utterance).slots[index];
    }

    public toJSON(): any {
        const json: any = {};
        for (let i = 0; i < this.slotCount(); i++) {
            json[this.slotName(i)] = this.slotValue(i);
        }
        return json;
    }
}
