import {ISlotValue, SlotMatch, SlotType} from "./SlotTypes";

export class BuiltinSlotTypes {
    public static values(): BuiltinSlotType [] {
        return [
            new BuiltinSlotType("AMAZON.NUMBER", [], "^[0-9]*$"),
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
        } else {
            slotMatch = super.match(value);
        }
        return slotMatch;
    }
}
