import {assert} from "chai";
import {IntentSchema} from "../src/IntentSchema";
import {InteractionModel} from "../src/InteractionModel";
import {SampleUtterances} from "../src/SampleUtterances";
import {Utterance} from "../src/Utterance";
import {VirtualAlexa} from "../src/VirtualAlexa";

describe("VirtualAlexaTest", function() {
    const intentSchema = {
        intents: [
            {
                intent: "Play",
            },
            {
                intent: "SlottedIntent",
                slots: [
                    {name: "SlotName", type: "SLOT_TYPE"},
                ],
            },
            {
                intent: "MultipleSlots",
                slots: [
                    {name: "SlotA", type: "SLOT_TYPE"},
                    {name: "SlotB", type: "SLOT_TYPE"},
                ],
            },
        ],
    };

    const sampleUtterances = {
        MultipleSlots: ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}"],
        Play: ["play", "play next", "play now"],
        SlottedIntent: ["slot {SlotName}"],
    };

    describe("#utter", () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterances(sampleUtterances)
            .intentSchema(intentSchema)
            .create();

        afterEach((done) => {
            const promise = virtualAlexa.endSession();
            promise.then(() => {
                done();
            });
        });

        it("Utters simple phrase", (done) => {
            virtualAlexa.utter("play now").then((response) => {
                done();
            });
        });

        it("Utters simple phrase with different case", (done) => {
            virtualAlexa.utter("play NOW").then((response) => {
                done();
            });
        });

        it("Utters slotted phrase", (done) => {
            virtualAlexa.utter("slot my slot").then((response) => {
                assert.isDefined(response.slot);
                assert.equal(response.slot.name, "SlotName");
                assert.equal(response.slot.value, "my slot");
                done();
            });
        });
    });

    describe("#endSession", () => {
        it("Starts and Ends Session", (done) => {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterances(sampleUtterances)
                .intentSchema(intentSchema)
                .create();

            virtualAlexa.launch().then(() => {
                virtualAlexa.endSession().then(() => {
                    done();
                });
            });
        });

    });
});
