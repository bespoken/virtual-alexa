import {ConfirmationStatus} from "./DialogManager";

export class SlotValue {
    public static fromJSON(json: {[id: string]: string}): {[id: string]: SlotValue} {
        if (!json) {
            return {};
        }

        const slots: any = {};
        for (const slotName of Object.keys(json)) {
            const slotValue = json[slotName];
            const o = new SlotValue(slotName, slotValue, ConfirmationStatus.NONE);
            slots[slotName] = o;
        }
        return slots;
    }

    public constructor(public name: string, public value: string, public confirmationStatus?: ConfirmationStatus) {}
}
