import {assert} from "chai";
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
            VirtualAlexa.Builder()
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

describe("VirtualAlexa Tests Using URL", function() {
    it("Calls a remote mock service via HTTPS", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .skillURL("https://httpbin.org/post")
            .create();
        virtualAlexa.utter("play now").then((response) => {
            assert.isDefined(response.data);
            assert.equal(response.url, "https://httpbin.org/post");
            done();
        });
    });

    it("Calls a remote mock service via HTTP", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .skillURL("http://httpbin.org/post")
            .create();
        virtualAlexa.utter("play now").then((response) => {
            assert.isDefined(response.data);
            assert.equal(response.url, "http://httpbin.org/post");
            done();
        });
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
            .interactionModelFile("./test/resources/InteractionModel.json")
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
                intent: "AMAZON.CancelIntent",
            },
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
        "AMAZON.CancelIntent": ["cancel it now"],
        "MultipleSlots": ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}"],
        "Play": ["play", "play next", "play now"],
        "SlottedIntent": ["slot {SlotName}"],
    };

    describe("#utter", () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterances(sampleUtterances)
            .intentSchema(intentSchema)
            .create();

        afterEach(async () => {
            await virtualAlexa.endSession();
        });

        it("Utters simple phrase", async () => {
            await virtualAlexa.utter("play now");
        });

        it("Utters simple phrase with different case", async () => {
            await virtualAlexa.utter("play NOW");
        });

        it("Utters slotted phrase", async () => {
            const response = await virtualAlexa.utter("slot my slot");
            assert.isDefined(response.slot);
            assert.equal(response.slot.name, "SlotName");
            assert.equal(response.slot.value, "my slot");
        });

        it("Utters builtin intent", async () => {
            const response = await virtualAlexa.utter("cancel");
            assert.equal(response.intent, "AMAZON.CancelIntent");
        });

        it("Utters builtin intent not in schema", async () => {
            const response = await virtualAlexa.utter("page up");
            assert.equal(response.intent, "AMAZON.CancelIntent");
        });

        it("Utters builtin intent with custom phrase", async () => {
            const response = await virtualAlexa.utter("cancel it now");
            assert.equal(response.intent, "AMAZON.CancelIntent");
        });

        it("Utters phrases and maintains session", async () => {
            // Calls our dummy skill twice
            // Inside the skill, it increments a counter by 1 each time
            let response = await virtualAlexa.utter("play now");
            assert.equal(response.sessionAttributes.counter, 0);
            response  = await virtualAlexa.utter("play now");
            assert.equal(response.sessionAttributes.counter, 1);
        });
    });

    describe("#intend", () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterances(sampleUtterances)
            .intentSchema(intentSchema)
            .create();

        afterEach(async () => {
            await virtualAlexa.endSession();
        });

        it("Intends simply", async () => {
            const response = await virtualAlexa.intend("Play");
            assert.isDefined(response);
            assert.isTrue(response.success);
        });

        it("Intends with filter", async () => {
            const reply = await virtualAlexa.filter((request) => {
                request.session.sessionId = "Filtered";
            }).intend("Play");

            assert.equal(reply.sessionAttributes.sessionId, "Filtered");
        });

        it("Intends with slot", async () => {
            const response = await virtualAlexa.intend("SlottedIntent", { SlotName: "Value" });
            assert.isDefined(response);
            assert.isTrue(response.success);
            assert.equal(response.slot.name, "SlotName");
            assert.equal(response.slot.value, "Value");
        });

        it("Intends with slot value but no slots on intent", async () => {
            try {
                await virtualAlexa.intend("Play", {SlotName: "Value"});
            } catch (e) {
                assert.equal(e.message, "Trying to add slot to intent that does not have any slots defined");
            }
        });

        it("Intends with slot value but slot does not exist", async () => {
            try {
                await virtualAlexa.intend("SlottedIntent", {SlotWrongName: "Value"});
            } catch (error) {
                assert.equal(error.message, "Trying to add undefined slot to intent: SlotWrongName");
            }
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

    describe("#launch", () => {
        it("Launches with filter", async () => {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterances(sampleUtterances)
                .intentSchema(intentSchema)
                .create();

            const reply = await virtualAlexa.filter((request) => {
               request.session.sessionId = "Filtered";
            }).launch();

            assert.equal(reply.sessionAttributes.sessionId, "Filtered");
        });

    });
});
