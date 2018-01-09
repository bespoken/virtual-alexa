import {assert} from "chai";
import {IntentSchema} from "../src/IntentSchema";
import {InteractionModel} from "../src/InteractionModel";
import {SampleUtterances} from "../src/SampleUtterances";
import {SlotTypes} from "../src/SlotTypes";
import {Utterance} from "../src/Utterance";

describe("UtteranceTest", function() {
    this.timeout(10000);

    const intentSchema = {
        intents: [
            {
                intent: "Play",
            },
            {
                intent: "Hello",
            },
            {
                intent: "NoSampleUtterances",
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
            {
                intent: "CustomSlot",
                slots: [
                    {name: "country", type: "COUNTRY_CODE"},
                ],
            },
            {
                intent: "NumberSlot",
                slots: [
                    {name: "number", type: "AMAZON.NUMBER"},
                ],
            },
            {
                intent: "StringSlot",
                slots: [
                    {name: "stringSlot", type: "StringSlotType"},
                ],
            },
            {
                intent: "AMAZON.HelpIntent",
            },
        ],
    };

    const sampleUtterances = {
        CustomSlot: ["{country}"],
        Hello: ["hi", "hello", "hi there", "good morning"],
        MultipleSlots: ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}", "{SlotA}"],
        NumberSlot: ["{number}", "{number} test"],
        Play: ["play", "play next", "play now"],
        SlottedIntent: ["slot {SlotName}"],
        StringSlot: ["{stringSlot}"],
    };

    const slotTypes = [{
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
                    synonyms: ["England", "Britain", "UK", "United Kingdom", "Great Britain"],
                    value: "UK",
                },
            },
        ],
    }];

    const is = IntentSchema.fromJSON(intentSchema);
    const model = new InteractionModel(IntentSchema.fromJSON(intentSchema),
        SampleUtterances.fromJSON(sampleUtterances),
        new SlotTypes(slotTypes));

    console.log("location: ", process.cwd());

    const japaneseModel = InteractionModel.fromFile("./test/resources/japanese_skill/models/ja-JP.json");

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

        it("Matches a simple phrase, ignores special characters", () => {
            const utterance = new Utterance(model, "play?");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Play");
        });

        it("Matches help", () => {
            const utterance = new Utterance(model, "help");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "AMAZON.HelpIntent");
        });

        it("Matches a slotted phrase", () => {
            const utterance = new Utterance(model, "slot value");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "SlottedIntent");
            assert.equal(utterance.slot(0), "value");
            assert.equal(utterance.slotByName("SlotName"), "value");
        });

        it("Matches a slotted phrase, no slot value", () => {
            const utterance = new Utterance(model, "slot");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "SlottedIntent");
        });

        it("Matches a phrase with multiple slots", () => {
            const utterance = new Utterance(model, "multiple a and b");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "MultipleSlots");
            assert.equal(utterance.slot(0), "a");
            assert.equal(utterance.slot(1), "b");
            assert.equal(utterance.slotByName("SlotA"), "a");
            assert.equal(utterance.slotByName("SlotB"), "b");
        });

        it("Matches a phrase with multiple slots reversed", () => {
            const utterance = new Utterance(model, "reversed a then b");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "MultipleSlots");
            assert.equal(utterance.slot(0), "a");
            assert.equal(utterance.slot(1), "b");
            assert.equal(utterance.slotByName("SlotA"), "b");
            assert.equal(utterance.slotByName("SlotB"), "a");
        });

        it("Matches a phrase with slot with enumerated values", () => {
            const utterance = new Utterance(model, "US");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "CustomSlot");
            assert.equal(utterance.slot(0), "US");
            assert.equal(utterance.slotByName("country"), "US");
        });

        it("Does not match a phrase with slot with enumerated values", () => {
            const utterance = new Utterance(model, "hi");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Hello");
        });

        it("Matches a phrase with slot with number value", () => {
            const utterance = new Utterance(model, "19801");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "NumberSlot");
            assert.equal(utterance.slot(0), "19801");
            assert.equal(utterance.slotByName("number"), "19801");
        });

        it("Matches a phrase with slot with long-form number value", () => {
            let utterance = new Utterance(model, "one");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "NumberSlot");
            assert.equal(utterance.slot(0), "1");
            assert.equal(utterance.slotByName("number"), "1");

            utterance = new Utterance(model, "Thirteen");
            assert.equal(utterance.slotByName("number"), "13");

            utterance = new Utterance(model, " ten ");
            assert.equal(utterance.slotByName("number"), "10");
        });

        it("Does not match a phrase with to a slot of number type", () => {
            const utterance = new Utterance(model, "19801a test");
            assert.equal(utterance.intent(), "MultipleSlots");
        });

        it("Matches a more specific phrase", () => {
            const utterance = new Utterance(model, "1900 test");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "NumberSlot");
        });

        it("Matches with symbols in the phrase", () => {
            const utterance = new Utterance(model, "good? #%.morning");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Hello");
        });

        it("Matches with punctuation in the phrase", () => {
            const utterance = new Utterance(model, "good, -morning:");
            assert.isTrue(utterance.matched());
            assert.equal(utterance.intent(), "Hello");
        });

        describe("Matches for International Languages", function() {
            it("Matches a slotted phrase", () => {
                const utterance = new Utterance(japaneseModel, "5 人のプレーヤー");
                assert.isTrue(utterance.matched());
                assert.equal(utterance.intent(), "GetIntentWithSlot");
                assert.equal(utterance.slot(0), "5");
                assert.equal(utterance.slotByName("number"), "5");
            });

            it("Matches a slotted phrase, no slot value", () => {
                const utterance = new Utterance(japaneseModel, "おはよう");
                assert.isTrue(utterance.matched());
                assert.equal(utterance.intent(), "GetIntent");
            });
        });
    });
});
