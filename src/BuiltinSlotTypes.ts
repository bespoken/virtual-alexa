import {ISlotValue, SlotMatch, SlotType} from "./SlotTypes";

export class BuiltinSlotTypes {
    public static values(): BuiltinSlotType [] {
        return [
            new NumberSlotType(),
        ];
    }
}

export class BuiltinSlotType extends SlotType {
    public constructor(public name: string, public values: ISlotValue[], private regex?: string) {
        super(name, values);
    }

    public match(value: string): SlotMatch {
        // Some slot types use regex - we use that if specified
        let slotMatch = new SlotMatch(false);
        if (this.regex) {
            const match = value.match(this.regex);
            if (match) {
                slotMatch = new SlotMatch(true, value);
            }
        }

        if (!slotMatch.matches) {
            slotMatch = super.match(value);
        }
        return slotMatch;
    }
}

export class NumberSlotType extends BuiltinSlotType {
    private static LONG_FORM_VALUES: {[id: string]: string []} = {
        1: ["one"],
        2: ["two"],
        3: ["three"],
        4: ["four"],
        5: ["five"],
        6: ["six"],
        7: ["seven"],
        8: ["eight"],
        9: ["nine"],
        10: ["ten"],
        11: ["eleven"],
        12: ["twelve"],
        13: ["thirteen"],
        14: ["fourteen"],
        15: ["fifteen"],
        16: ["sixteen"],
        17: ["seventeen"],
        18: ["eighteen"],
        19: ["nineteen"],
        20: ["twenty"],
    };

    private static LONG_FORM_SLOT_VALUES(): ISlotValue[] {
        const slotValues = [];

        for (const key of Object.keys(NumberSlotType.LONG_FORM_VALUES)) {
            const values = NumberSlotType.LONG_FORM_VALUES[key];
            slotValues.push({id: key, name: {value: key, synonyms: values}});
        }
        return slotValues;
    }

    public constructor() {
        super("AMAZON.NUMBER", NumberSlotType.LONG_FORM_SLOT_VALUES(), "^[0-9]*$");
    }
}
