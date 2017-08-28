import {assert} from "chai";
import {IntentSchema} from "../src/IntentSchema";
import {InteractionModel} from "../src/InteractionModel";
import {SampleUtterances} from "../src/SampleUtterances";
import {Utterance} from "../src/Utterance";

describe("UtteranceTest", function() {
    this.timeout(10000);

    const intentSchema = {
        intents: [
            {
                intent: "Play",
            },
        ],
    };

    const sampleUtterances = {
        Play: ["play", "play next", "play now"],
    };

    const model = new InteractionModel(IntentSchema.fromJSON(intentSchema),
        SampleUtterances.fromJSON(sampleUtterances));

    describe("#matchIntent", () => {
        it("Matches a simple phrase", () => {
            const utterance = new Utterance(model, "play");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Play");
        });

        it("Matches a simple phrase, ignores case", () => {
            const utterance = new Utterance(model, "Play");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Play");
        });
    });
});