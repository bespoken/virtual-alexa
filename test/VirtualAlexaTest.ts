import {assert} from "chai";
import {IntentSchema} from "../src/IntentSchema";
import {InteractionModel} from "../src/InteractionModel";
import {SampleUtterances} from "../src/SampleUtterances";
import {Utterance} from "../src/Utterance";
import {VirtualAlexa} from "../src/VirtualAlexa";

describe("VirtualAlexa Tests Using Files", function() {
    it("Parses the files and does a simple utterance", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();
        virtualAlexa.utter("play now").then((response) => {
            assert.isDefined(response);
            assert.isTrue(response.success);
            done();
        });
    });

    it("Has a bad filename", () => {
        try {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterancesFile("./test/resources/SampleUtterancesWrong.txt")
                .intentSchemaFile("./test/resources/IntentSchema.json")
                .create();
            assert(false, "This should not be reached");
        } catch (e) {
            assert.isDefined(e);
        }
    });
});

describe("VirtualAlexa Tests Using Unified Interaction Model", function() {
    const interactionModel = {
        intents: [
            {
                name: "Play",
                samples: ["play", "play next", "play now"],
            },
            {
                name: "SlottedIntent",
                samples: ["slot {SlotName}"],
                slots: [
                    {name: "SlotName", type: "SLOT_TYPE"},
                ],
            },
            {
                name: "MultipleSlots",
                samples: ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}"],
                slots: [
                    {name: "SlotA", type: "SLOT_TYPE"},
                    {name: "SlotB", type: "SLOT_TYPE"},
                ],
            },
        ],
    };

    it("Parses the JSON and does a simple utterance", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();
        virtualAlexa.utter("play now").then((response) => {
            assert.isDefined(response);
            assert.isTrue(response.success);
            done();
        });
    });

    it("Parses the file and does a simple utterance", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();
        virtualAlexa.intend("AMAZON.CancelIntent").then((response) => {
            assert.isDefined(response);
            assert.isTrue(response.success);
            done();
        });
    });
});

describe("VirtualAlexa Tests Using JSON", function() {
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

    describe("#intend", () => {
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

        it("Intends simply", (done) => {
            virtualAlexa.intend("Play").then((response) => {
                assert.isDefined(response);
                assert.isTrue(response.success);
                done();
            });
        });

        it("Intends with slot", (done) => {
            virtualAlexa.intend("SlottedIntent", { SlotName: "Value" }).then((response) => {
                assert.isDefined(response);
                assert.isTrue(response.success);
                assert.equal(response.slot.name, "SlotName");
                assert.equal(response.slot.value, "Value");
                done();
            });
        });

        it("Intends with slot value but no slots on intent", (done) => {
            virtualAlexa.intend("Play", { SlotName: "Value" }).catch((error) => {
                assert.equal(error.message, "Trying to add slot to intent that does not have any slots defined");
                done();
            });
        });

        it("Intends with slot value but slot does not exist", (done) => {
            virtualAlexa.intend("SlottedIntent", { SlotWrongName: "Value" }).catch((error) => {
                assert.equal(error.message, "Trying to add undefined slot to intent: SlotWrongName");
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
