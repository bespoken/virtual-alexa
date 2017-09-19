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
        ],
    };

    const sampleUtterances = {
        CustomSlot: ["{country}"],
        MultipleSlots: ["multiple {SlotA} and {SlotB}", "reversed {SlotB} then {SlotA}"],
        Play: ["play", "play next", "play now"],
        SlottedIntent: ["slot {SlotName}"],
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
        SampleUtterances.fromJSON(sampleUtterances, is, new SlotTypes(slotTypes)));

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
    });
});
