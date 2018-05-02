import {DialogIntent} from "./DialogIntent";
import {DialogResponse} from "./DialogResponse";
import {InteractionModel} from "./InteractionModel";
import {IResponse} from "./IResponse";
import {SkillResponse} from "./SkillResponse";

export enum DialogState {
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS",
    STARTED = "STARTED",
}
export class DialogManager {
    private _confirmingSlot: ISlotState = undefined;
    private _dialogIntent: DialogIntent = undefined;
    private _dialogState: DialogState = undefined;
    private _slots: {[id: string]: ISlotState} = {};
    public constructor(public interactionModel: InteractionModel) {}

    public handleDirective(response: SkillResponse): void {
        // Look for a dialog directive - trigger dialog mode if so
        for (const directive of response.response.directives) {
            if (directive.type.startsWith("Dialog")) {
                const intentName = directive.updatedIntent.name;
                if (this._dialogIntent && this._dialogIntent.name !== intentName) {
                    throw new Error("Switching dialogs before previous dialog complete. "
                        + " New dialog: " + intentName + " Old Dialog: " + this._dialogIntent.name);
                }

                this._dialogIntent = this.interactionModel.dialogIntent(intentName);
                if (!this._dialogIntent) {
                    throw new Error("No match for dialog name: " + intentName);
                }

                this._dialogState = DialogState.STARTED;
            }
        }
    }

    public handleUtterance(intentName: string, slots: {[id: string]: string}): IResponse | void {
        if (this.isDialog()) {
            return this.updateDialog(intentName, slots);
        } else if (this.interactionModel.dialogIntent(intentName)) {
            // If we have not started a dialog yet, if this intent ties off to a dialog, save the slot state
            this.updateSlotStates(slots);
        }
    }

    public isDialog() {
        return this._dialogState !== undefined;
    }

    public dialogState() {
        return this._dialogState;
    }

    public slots() {
        return this._slots;
    }

    private updateSlotStates(slots: {[id: string]: string}): void {
        for (const slotName of Object.keys(slots)) {
            const slotValue = slots[slotName];
            this._slots[slotName] = {
                confirmationStatus: ConfirmationStatus.NONE,
                name: slotName,
                value: slotValue,
            };
        }
    }

    private updateDialog(intentName: string, slots: {[id: string]: string}): DialogResponse | undefined {
        // If we are confirming a slot, then answer should be yes or no
        if (this._confirmingSlot) {
            this._confirmingSlot.confirmationStatus = (intentName === "AMAZON.YesIntent")
                ? ConfirmationStatus.CONFIRMED
                : ConfirmationStatus.DENIED;
        } else {
            this.updateSlotStates(slots);
        }

        // Now figure out the next slot
        for (const slot of this._dialogIntent.slots) {
            const slotState = this._slots[slot.name];
            if (slotState) {
                if (slot.confirmationRequired) {
                    if (slotState.confirmationStatus === ConfirmationStatus.NONE) {
                        return new DialogResponse(slot.confirmationPrompt().variation().value);
                    } else if (slotState.confirmationStatus === ConfirmationStatus.DENIED) {
                        return new DialogResponse(slot.elicitationPrompt().variation().value);
                    }
                }
            } else if (slot.elicitationRequired) { // If no slot state, and elicitation required, do this next
                const prompt = slot.elicitationPrompt();
                return new DialogResponse(prompt.variation().value);
            }
        }

        // dialog state is done if we get here - we do not need to return anything
        this._dialogState = DialogState.COMPLETED;
        return undefined;
    }
}

export interface ISlotState {
    confirmationStatus: ConfirmationStatus;
    name: string;
    value: string;
}

export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    DENIED = "DENIED",
    NONE = "NONE",
}
