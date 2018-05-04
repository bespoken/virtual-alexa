import {ConfirmationStatus} from "./DialogManager";

export class SlotValue {
    public constructor(public name: string, public value: string, public confirmationStatus?: ConfirmationStatus) {}

    public update(newSlot: SlotValue) {
        if (newSlot.value) {
            this.value = newSlot.value;
        }
    }
}
