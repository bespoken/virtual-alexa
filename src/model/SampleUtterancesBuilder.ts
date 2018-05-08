import * as fs from "fs";
import {SampleUtterances} from "virtual-core";

export class SampleUtterancesBuilder {
    public static fromFile(file: string): SampleUtterances {
        const data = fs.readFileSync(file);
        const utterances = new SampleUtterances();
        SampleUtterancesBuilder.parseFlatFile(utterances, data.toString());
        return utterances;
    }

    public static fromJSON(sampleUtterancesJSON: any) {
        const sampleUtterances = new SampleUtterances();
        for (const intent of Object.keys(sampleUtterancesJSON)) {
            for (const sample of sampleUtterancesJSON[intent]) {
                sampleUtterances.addSample(intent, sample);
            }
        }
        return sampleUtterances;
    }

    private static parseFlatFile(utterances: SampleUtterances, fileData: string): void {
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
            utterances.addSample(intent, sample);
        }
    }
}
