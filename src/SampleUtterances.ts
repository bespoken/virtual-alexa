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
            sampleUtterances.samples[intent] = [];
            for (const sample of sampleUtterancesJSON[intent]) {
                sampleUtterances.samples[intent].push(new SamplePhrase(intent, sample));
            }
        }
        return sampleUtterances;
    }

    private samples: {[id: string]: SamplePhrase[]} = {};

    public intents(): string[] {
        return Object.keys(this.samples);
    }

    public samplesForIntent(intent: string): SamplePhrase [] {
        return this.samples[intent];
    }

    /**
     * To handle the case when what is said does not match any sample utterance
     */
    public defaultUtterance(): SamplePhrase {
        // Just grab the first sample for now
        const firstIntent = Object.keys(this.samples)[0];
        return this.samples[firstIntent][0];
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
            let intentSamples: SamplePhrase[] = [];
            if (intent in this.samples) {
                intentSamples = this.samples[intent];
            } else {
                this.samples[intent] = intentSamples;
            }

            intentSamples.push(new SamplePhrase(intent, sample));
        }
    }
}

/**
 * Helper class for handling phrases - breaks out the slots within a phrase
 */
export class SamplePhrase {
    private slotNames: string[] = [];
    private regex: string;

    public constructor(public intent: string, public phrase: string) {
        this.phrase = phrase.toLowerCase();
        this.regex = this.phraseToRegex(this.phrase);
    }

    public slotName(index: number): string | undefined {
        if (index >= this.slotNames.length) {
            return undefined;
        }

        return this.slotNames[index];
    }

    public slotCount(): number {
        return this.slotNames.length;
    }

    /**
     * Tests to see if the utterances matches the sample phrase
     * If it does, returns an array of matching slot values
     * If it does not, returns undefined
     * @param {string} utterance
     * @returns {[]}
     */
    public matchesUtterance(utterance: string): string[] | undefined {
        const match = utterance.match(this.regex);
        console.log("RegEx: " + this.regex);
        let result: string[] | undefined;
        if (match) {
            result = match.slice(1);
        }
        return result;
    }

    /**
     * Takes a phrase like "This is a {Slot}" and turns it into a regex like "This is a(.*)"
     * This is so we can compare the sample utterances (which have names that tie off to the slot names defined in the
     *  intent schema) with the actual utterance, which have values in the slot positions (as opposed to the names)
     * @param phrase
     */
    private phraseToRegex(phrase: string): string {
        const startIndex = phrase.indexOf("{");
        if (startIndex !== -1) {
            const endIndex = phrase.indexOf("}", startIndex);
            this.slotNames.push(phrase.substring(startIndex + 1, endIndex));
            phrase = phrase.substring(0, startIndex).trim() + "(.*)" + phrase.substring(endIndex + 1).trim();
            phrase = this.phraseToRegex(phrase);
        }
        return phrase;
    }
}
