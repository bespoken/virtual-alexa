import {BuiltinUtterances} from "./BuiltinUtterances";
import {DialogIntent} from "./DialogIntent";
import {DialogResponse} from "./DialogResponse";
import {InteractionModel} from "./InteractionModel";
import {IResponse} from "./IResponse";
import {SkillResponse} from "./SkillResponse";
import {SlotValue} from "./SlotValue";

export enum DialogState {
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS",
    STARTED = "STARTED",
}

export class DialogManager {
    private _confirmingSlot: SlotValue = undefined;
    private _confirmationStatus: ConfirmationStatus;
    private _dialogIntent: DialogIntent = undefined;
    private _dialogState: DialogState = undefined;
    private _slots: {[id: string]: SlotValue} = {};
    public constructor(public interactionModel: InteractionModel) {}

    public handleDirective(response: SkillResponse): DialogResponse | undefined {
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
                this._confirmationStatus = ConfirmationStatus.NONE;

                // We immediately want to get the next response when the dialog directive comes down
                const dialogResponse = this.updateDialog(directive.updatedIntent.slots);
                if (dialogResponse) {
                    return dialogResponse;
                }
            }
        }
        return undefined;
    }

    public confirmationStatus() {
        return this._confirmationStatus;
    }

    public matchConfirmationUtterance(utterance: string): string | undefined {
        // If we are in confirmation mode, check if this is yes or no
        if (this._confirmingSlot) {
            if (BuiltinUtterances.values()["AMAZON.YesIntent"].indexOf(utterance) !== -1) {
                return "AMAZON.YesIntent";
            } else if (BuiltinUtterances.values()["AMAZON.NoIntent"].indexOf(utterance) !== -1) {
                return "AMAZON.NoIntent";
            }
        }
        return undefined;
    }

    public handleUtterance(intentName: string, slots: {[id: string]: SlotValue}): IResponse | void {
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

    private confirmationPrompt(slots: {[id: string]: SlotValue}): string {
        return this.interactionModel.prompt(this._dialogIntent.prompts.confirmation).variation(slots);
    }

    private updateSlotStates(slots: {[id: string]: SlotValue}): void {
        for (const slotName of Object.keys(slots)) {
            this._slots[slotName] = slots[slotName];
        }
    }

    private updateDialog(intentName?: string, slots?: {[id: string]: SlotValue}): DialogResponse | undefined {
        // Check if we are confirming the intent as a whole
        if (this._dialogState === DialogState.COMPLETED
            && this._dialogIntent.confirmationRequired
            && this._confirmationStatus === ConfirmationStatus.NONE
        ) {
            this._confirmationStatus = (intentName === "AMAZON.YesIntent")
                ? ConfirmationStatus.CONFIRMED
                : ConfirmationStatus.DENIED;
            return undefined;
        }

        // If we are confirming a slot, then answer should be yes or no
        if (this._confirmingSlot) {
            this._confirmingSlot.confirmationStatus = (intentName === "AMAZON.YesIntent")
                ? ConfirmationStatus.CONFIRMED
                : ConfirmationStatus.DENIED;
            this._confirmingSlot = undefined;
        } else if (slots) {
            this.updateSlotStates(slots);
        }

        // Now figure out the next slot
        for (const slot of this._dialogIntent.slots) {
            const slotState = this._slots[slot.name];
            if (slotState) {
                if (slot.confirmationRequired) {
                    if (slotState.confirmationStatus === ConfirmationStatus.NONE) {
                        this._confirmingSlot = slotState;
                        return new DialogResponse(slot.confirmationPrompt().variation(this.slots()));
                    } else if (slotState.confirmationStatus === ConfirmationStatus.DENIED) {
                        return new DialogResponse(slot.elicitationPrompt().variation(this.slots()));
                    }
                }
            } else if (slot.elicitationRequired) { // If no slot state, and elicitation required, do this next
                const prompt = slot.elicitationPrompt();
                return new DialogResponse(prompt.variation(this.slots()));
            }
        }

        // dialog state is done if we get here - we do not need to return anything
        this._dialogState = DialogState.COMPLETED;
        if (this._dialogIntent.confirmationRequired) {
            return new DialogResponse(this.confirmationPrompt(this.slots()));
        }
        return undefined;
    }
}

export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    DENIED = "DENIED",
    NONE = "NONE",
}
