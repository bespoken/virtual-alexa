import {ISlotState} from "./DialogManager";

export class SlotPrompt {
    public static fromJSON(json: any): SlotPrompt {
        const prompt = new SlotPrompt();
        Object.assign(prompt, json);
        return prompt;
    }

    public id: string;
    public variations: SlotVariation[];

    public variation(slots: {[id: string]: ISlotState}) {
        let value = this.variations[0].value;
        // Replace slot values in the variation, if they exist
        // They will look like this "Are you sure you want {size} dog?"
        for (const slot of Object.keys(slots)) {
            const slotValue = slots[slot];
            value = value.split("{" + slot + "}").join(slotValue.value);
        }
        return value;
    }
}

export class SlotVariation {
    public type: string;
    public value: string;
}
