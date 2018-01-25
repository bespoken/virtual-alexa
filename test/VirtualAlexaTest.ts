import {assert} from "chai";
import {VirtualAlexa} from "../src/VirtualAlexa";

describe("VirtualAlexa Tests Using Files", function() {
    it("Parses the files and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        let requestToCheck: any;
        assert(virtualAlexa.filter((request) => {
            requestToCheck = request;
        }));

        const response  = await virtualAlexa.utter("play now") as any;

        assert.isDefined(response);

        assert.isTrue(response.success);
        assert.equal(virtualAlexa.context().locale(), "en-US");
        assert.equal(requestToCheck.request.locale, "en-US");

    });

    it("Parses the files and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .locale("de-DE")
            .create();

        let requestToCheck: any;
        assert(virtualAlexa.filter((request) => {
            requestToCheck = request;
        }));
        const response  = await virtualAlexa.utter("play now") as any;
        assert.isDefined(response);

        assert.isTrue(response.success);
        assert.equal(virtualAlexa.context().locale(), "de-DE");
        assert.equal(requestToCheck.request.locale, "de-DE");
    });

    it("Parses the SMAPI format interaction model and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModelFile("./test/resources/InteractionModelSMAPI.json")
            .create();
        await virtualAlexa.filter((request) => {
            assert.equal(request.request.intent.name, "TellMeMoreIntent");
        }).utter("contact info");
    });

    it("Parses the Interaction Model format V2 and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModelFile("./test/resources/LanguageModel.json")
            .create();
        await virtualAlexa.filter((request) => {
            assert.equal(request.request.intent.name, "TellMeMoreIntent");
        }).utter("contact info");
    });

    it("Parses the Interaction Model from a locale and does a simple utterance", async () => {
        process.chdir("test/resources");
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("index.handler")
            .locale("de-DE")
            .create();
        const response  = await virtualAlexa.utter("contact info") as any;
        assert.equal(response.intent, "TellMeMoreIntent");
        process.chdir("../..");
    });

    it("Parses the Interaction Model from the default locale and does a simple utterance", async () => {
        process.chdir("test/resources");
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("index.handler")
            .create();
        const response  = await virtualAlexa.utter("contact info") as any;
        assert.equal(response.intent, "TellMeMoreIntent");
        process.chdir("../..");
    });

    it("Throws error when locale file is not present", async () => {
        try {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("index.handler")
                .create();
            assert(false, "This should not be reached");

        } catch (e) {
            assert.isDefined(e);
        }
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
    this.timeout(5000);
    it("Calls a remote mock service via HTTPS", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .skillURL("https://httpbin.org/post")
            .create();
        const response = await virtualAlexa.utter("play now") as any;
        assert.isDefined(response.data);
        assert.equal(response.url, "https://httpbin.org/post");
    });

    it("Calls a remote mock service via HTTP", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .skillURL("http://httpbin.org/post")
            .create();
        const response = await virtualAlexa.utter("play now") as any;
        assert.isDefined(response.data);
        assert.equal(response.url, "http://httpbin.org/post");
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
                name: "SlottedIntentEmptySynonymArray",
                samples: ["slotEmptySynonymArray {SlotEmptySynonymArray}"],
                slots: [
                    {name: "SlotEmptySynonymArray", type: "SLOT_EMPTY_SYNONYM_ARRAY_TYPE"},
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
            {
                name: "CustomSlot",
                samples: ["custom {customSlot}"],
                slots: [
                    {name: "customSlot", type: "COUNTRY_CODE"},
                ],
            },
        ],
        types: [
            {
                name: "SLOT_EMPTY_SYNONYM_ARRAY_TYPE",
                values: [
                    {
                        id: "null",
                        name: {
                            synonyms: [],
                            value: "VALUE1",
                        },
                    },
                ],
            },
            {
            name: "COUNTRY_CODE",
            values: [
                {
                    id: "US",
                    name: {
                        synonyms: ["USA", "America", "US"],
                        value: "US",
                    },
                },
                {
                    id: "DE",
                    name: {
                        synonyms: ["Germany", "DE"],
                        value: "DE",
                    },
                },
                {
                    id: "UK",
                    name: {
                        synonyms: ["United Kingdom", "England"],
                        value: "UK",
                    },
                },
            ],
        }],
    };

    it("Parses the JSON and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();
        const response = await virtualAlexa.utter("play now") as any;
        assert.isDefined(response);
        assert.isTrue(response.success);
    });

    it("Parses the file and does a simple utterance", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModelFile("./test/resources/InteractionModel.json")
            .create();
        const response = await virtualAlexa.intend("AMAZON.CancelIntent") as any;
        assert.isDefined(response);
        assert.isTrue(response.success);
    });

    it("Utters builtin intent with custom phrase", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();

        await virtualAlexa.filter((request) => {
            assert.equal(request.request.intent.name, "CustomSlot");
        }).utter("custom DE");
    });

    it("Utters slotted phrase with empty synonym array", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();

        await virtualAlexa.filter((request) => {
            assert.equal(request.request.intent.name, "SlottedIntentEmptySynonymArray");
            assert.equal(request.request.intent.slots.SlotEmptySynonymArray.value, "VALUE1");
        }).utter("slotEmptySynonymArray value1");
    });

    it("Utters slotted phrase with different synonym array", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.index.handler")
            .interactionModel(interactionModel)
            .create();

        await virtualAlexa.filter((request) => {
            assert.equal(request.request.intent.name, "CustomSlot");
            assert.equal(request.request.intent.slots.customSlot.value, "UK");
        }).utter("custom UK");
    });
});

describe("VirtualAlexa Tests Using JSON", function() {
    const intentSchema = {
        intents: [
            {
                intent: "AFirstIntent",
            },
            {
                intent: "AMAZON.CancelIntent",
            },
            {
                intent: "AMAZON.StopIntent",
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
        "AFirstIntent": ["default"],
        "AMAZON.CancelIntent": ["cancel it now"],
        "MultipleSlots": ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}"],
        "Play": ["play", "play next", "play now", "PLAY case"],
        "SlottedIntent": ["slot {SlotName}"],
    };

    describe("#utter", () => {
        let virtualAlexa: VirtualAlexa;
        beforeEach(() => {
            virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterances(sampleUtterances)
                .intentSchema(intentSchema)
                .create();
        });

        afterEach(async () => {
            await virtualAlexa.resetFilter().endSession();
        });

        it("Utters simple phrase", async () => {
            const response = await virtualAlexa.filter((request) => {
                assert.isUndefined(request.context.System.device.deviceId);
                assert.isUndefined(request.context.System.apiEndpoint, "https://api.amazonalexa.com/");
                assert.isDefined(request.context.System.device.supportedInterfaces.AudioPlayer);
                assert.isDefined(request.context.System.user.userId);
                assert.isUndefined(request.context.System.user.permissions);
                assert.equal(request.request.intent.name, "Play");
            }).utter("play now");

            // Test the response object
            assert.equal(response.prompt(), "SSML");
            assert.equal(response.reprompt(), "TEXT");
            assert.equal(response.card().content, "content");
            assert.equal(response.cardImage().smallImageUrl, "smallImageUrl");
            assert.equal(response.cardContent(), "content");
            assert.equal(response.cardTitle(), "title");
            assert.equal(response.cardLargeImage(), "largeImageUrl");
            assert.equal(response.cardSmallImage(), "smallImageUrl");
            assert.equal(response.attr("counter"), "0");
            assert.equal(response.attrs("counter", "key1").counter, "0");
            assert.isUndefined(response.attrs("counter", "key1").key1);
        });

        it("Utters simple phrase with different case", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "Play");
            }).utter("play NOW");
        });

        it("Utters simple phrase with different case where sample is upper case", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "Play");
            }).utter("play case");
        });

        it("Utters slotted phrase", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.slots.SlotName.value, "my slot");
            }).utter("Slot my slot");
        });

        it("Utters slotted phrase with no space", async () => {
            // Make sure our regular expression expects a space for between sample phrase and slot
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "AFirstIntent");
            }).utter("Slotmy slot");
        });

        it("Utters builtin intent", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "AMAZON.CancelIntent");
            }).utter("cancel");
        });

        it("Utters builtin intent with custom phrase", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "AMAZON.CancelIntent");
            }).utter("cancel it now");
        });

        it("Utters builtin intent not in schema", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "AFirstIntent");
            }).utter("page up");
        });

        it("Defaults to first phrase", async () => {
            await virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.name, "AFirstIntent");
            }).utter("nonexistent phrase");
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

    describe("#utterWithDeviceInfo", () => {
        it("Utters simple phrase with device info", async () => {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterances(sampleUtterances)
                .intentSchema(intentSchema)
                .create();
            virtualAlexa.context().device().setID("testID");

            await virtualAlexa.filter((request) => {
                assert.isDefined(request.context.System.device.deviceId);
                assert.equal(request.context.System.apiEndpoint, "https://api.amazonalexa.com/");
                assert.isDefined(request.context.System.device.supportedInterfaces.AudioPlayer);
                assert.isDefined(request.context.System.user.userId);
                assert.isDefined(request.context.System.user.permissions);
                assert.isDefined(request.context.System.user.permissions.consentToken);
                assert.equal(request.request.intent.name, "Play");
            }).utter("play now");
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
            const response = await virtualAlexa.intend("Play") as any;
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
            const response = await virtualAlexa.intend("SlottedIntent", { SlotName: "Value" }) as any;
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

        it("Starts and Is Asked To Stop", (done) => {
            const virtualAlexa = VirtualAlexa.Builder()
                .handler("test.resources.index.handler")
                .sampleUtterances(sampleUtterances)
                .intentSchema(intentSchema)
                .create();

            virtualAlexa.launch().then(() => {
                virtualAlexa.utter("stop").then(() => {
                    assert.isUndefined(virtualAlexa.context().session());
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

describe("VirtualAlexa Tests Using Custom Function", function() {
    it("Calls the custom function correctly", async () => {
        const myFunction = function(event: any, context: any) {
            context.done(null, { custom: true });
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        const reply = await virtualAlexa.filter((request) => {
            request.session.sessionId = "Filtered";
        }).launch() as any;

        assert.isTrue(reply.custom);
    });
});
