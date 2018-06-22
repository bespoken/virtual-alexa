import {SkillContext} from "../core/SkillContext";
import {SkillResponse} from "../core/SkillResponse";
import {SlotValue} from "../impl/SlotValue";
import {UserIntent} from "../impl/UserIntent";
import {BuiltinUtterances} from "../model/BuiltinUtterances";
import {DelegatedDialogResponse} from "./DelegatedDialogResponse";
import {DialogIntent} from "./DialogIntent";
import {DialogOutput} from "./DialogOutput";

export enum DialogState {
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS",
    STARTED = "STARTED",
}

export class DialogManager {
    private _delegated: boolean = false;
    private _confirmingIntent: boolean = false;
    private _confirmingSlot: SlotValue = undefined;
    private _confirmationStatus: ConfirmationStatus;
    private _dialogIntent: DialogIntent = undefined;
    private _dialogState: DialogState = undefined;
    private _slots: {[id: string]: SlotValue} = {};
    public constructor(public context: SkillContext) {}

    public handleDirective(response: SkillResponse): DialogOutput {
        // Look for a dialog directive - trigger dialog mode if so
        for (const directive of response.response.directives) {
            if (directive.type.startsWith("Dialog")) {
                if (directive.updatedIntent) {
                    this._dialogIntent = this.context.interactionModel().dialogIntent(directive.updatedIntent.name);

                    if (!this._dialogIntent) {
                        throw new Error("No match for dialog name: " + directive.updatedIntent.name);
                    }
                }

                if (directive.type === "Dialog.Delegate") {
                    this._delegated = true;
                    this._dialogState = DialogState.STARTED;
                    this._confirmationStatus = ConfirmationStatus.NONE;

                    // We immediately want to get the next response when the dialog directive comes down
                    const dialogResponse = this.processDialog(directive.updatedIntent.name,
                        directive.updatedIntent.slots);
                    if (dialogResponse) {
                        return dialogResponse;
                    }
                } else if (directive.type === "Dialog.ElicitSlot"
                    || directive.type === "Dialog.ConfirmSlot"
                    || directive.type === "Dialog.ConfirmIntent") {
                    // Start the dialog if not started, otherwise mark as in progress
                    this._dialogState = this._dialogState ? DialogState.IN_PROGRESS : DialogState.STARTED;
                    if (!this._confirmationStatus) {
                        this._confirmationStatus = ConfirmationStatus.NONE;
                    }

                    if (directive.updatedIntent) {
                        this.updateSlotStates(directive.updatedIntent.slots);
                    }

                    if (directive.type === "Dialog.ConfirmSlot") {
                        const slotToConfirm = directive.slotToConfirm;
                        this._confirmingSlot = this.slots()[slotToConfirm];
                    } else if (directive.type === "Dialog.ConfirmIntent") {
                        this._confirmingIntent = true;
                        this._dialogState = DialogState.COMPLETED;
                    }
                    // For explicit slot handling, the output speech from the skill response is used
                    return DialogOutput.noop();
                }

            }
        }
        return DialogOutput.noop();
    }

    public confirmationStatus() {
        return this._confirmationStatus;
    }

    public handleUtterance(utterance: string): UserIntent {
        // If we are in confirmation mode, check if this is yes or no
        if (this._confirmingSlot || this._dialogState === DialogState.COMPLETED) {
            if (BuiltinUtterances.values()["AMAZON.YesIntent"].indexOf(utterance) !== -1) {
                return new UserIntent(this.context, "AMAZON.YesIntent");
            } else if (BuiltinUtterances.values()["AMAZON.NoIntent"].indexOf(utterance) !== -1) {
                return new UserIntent(this.context, "AMAZON.NoIntent");
            }
        } else if (this.isDialog()) {
            const providedSlots: any = {};
            let matched = false;
            // Loop through slot values looking for a match
            for (const slot of this._dialogIntent.slots) {
                const slotType = this.context.interactionModel().slotTypes.slotType(slot.type);
                const match = slotType.match(utterance);
                if (match.matches) {
                    matched = true;
                    providedSlots[slot.name] = match.value;
                }
            }

            if (matched) {
                return new UserIntent(this.context, this._dialogIntent.name, providedSlots);
            }
        }
        return undefined;
    }

    public handleIntent(intent: UserIntent): DialogOutput {
        if (this.isDialog()) {
            // Check to make sure this intent applies to the dialog
            if (intent.name === this._dialogIntent.name ||
                intent.name === "AMAZON.YesIntent" ||
                intent.name === "AMAZON.NoIntent"
            ) {
                return this.processDialog(intent.name, intent.slots());
            } else {
                return this.dialogExited();
            }
        } else if (this.context.interactionModel().dialogIntent(intent.name)) {
            // Set the dialog intent here - it may not be set by the skill in its response
            this._dialogIntent = this.context.interactionModel().dialogIntent(intent.name);

            // If we have not started a dialog yet, if this intent ties off to a dialog, save the slot state
            this.updateSlotStates(intent.slots());
        }
        return DialogOutput.noop();
    }

    public isDelegated() {
        return this._delegated;
    }

    public isDialog() {
        return this._dialogState !== undefined;
    }

    public dialogState() {
        return this._dialogState;
    }

    public reset() {
        this.dialogExited();
    }

    public slots() {
        return this._slots;
    }

    private confirmationPrompt(slots: {[id: string]: SlotValue}): string {
        return this.context.interactionModel().prompt(this._dialogIntent.prompts.confirmation).variation(slots);
    }

    private updateSlotStates(slots: {[id: string]: SlotValue}): void {
        if (!slots) {
            return;
        }

        for (const slotName of Object.keys(slots)) {
            const slot = this._slots[slotName];
            if (slot) {
                slot.update(slots[slotName]);
            } else {
                this._slots[slotName] = slots[slotName];
            }
        }
    }

    private dialogExited(): DialogOutput {
        this._confirmationStatus = undefined;
        this._confirmingIntent = false;
        this._delegated = false;
        this._dialogState = undefined;
        this._dialogIntent = undefined;
        this._slots = {};
        return DialogOutput.noop();
    }

    private processDialog(intentName: string, slots: {[id: string]: SlotValue}): DialogOutput {
        // Check if we are confirming the intent as a whole
        // We are confirming the intent when the dialog is completed and either:
        //  The confirm is required for the dialog if it is delegated and the dialog is set to confirmation required
        //  OR an explicit confirmIntent directive has been sent
        const confirmationRequired = (this.isDelegated() && this._dialogIntent.confirmationRequired)
            || this._confirmingIntent;
        if (this._dialogState === DialogState.COMPLETED
            && confirmationRequired
            && this._confirmationStatus === ConfirmationStatus.NONE
        ) {
            this._confirmationStatus = (intentName === "AMAZON.YesIntent")
                ? ConfirmationStatus.CONFIRMED
                : ConfirmationStatus.DENIED;
            return DialogOutput.transformedIntent(new UserIntent(this.context, this._dialogIntent.name));
        }

        // If we are confirming a slot, then answer should be yes or no
        if (this._confirmingSlot) {
            // If not a yes or no, must be some other intent and we exit dialog handling
            if (intentName === "AMAZON.YesIntent") {
                this._confirmingSlot.confirmationStatus = ConfirmationStatus.CONFIRMED;
                this._confirmingSlot = undefined;
            } else if (intentName === "AMAZON.NoIntent") {
                this._slots[this._confirmingSlot.name].value = undefined;
                this._confirmingSlot = undefined;
            } else {
                return this.dialogExited();
            }
        } else {
            this.updateSlotStates(slots);
        }

        // Stop processing here if this is not a delegated dialog
        if (!this.isDelegated()) {
            return DialogOutput.transformedIntent(new UserIntent(this.context, this._dialogIntent.name));
        }

        // Now figure out the next slot
        let delegatedResponse: DelegatedDialogResponse;
        for (const slot of this._dialogIntent.slots) {
            const slotState = this._slots[slot.name];
            if (slotState && slotState.value) {
                if (slot.confirmationRequired) {
                    if (slotState.confirmationStatus === ConfirmationStatus.NONE) {
                        this._confirmingSlot = slotState;
                        const prompt = slot.confirmationPrompt().variation(this.slots());
                        delegatedResponse = new DelegatedDialogResponse(prompt);
                        break;
                    } else if (slotState.confirmationStatus === ConfirmationStatus.DENIED) {
                        const prompt = slot.elicitationPrompt().variation(this.slots());
                        delegatedResponse = new DelegatedDialogResponse(prompt);
                        break;
                    }
                }
            } else if (slot.elicitationRequired) { // If no slot state, and elicitation required, do this next
                const prompt = slot.elicitationPrompt();
                delegatedResponse = new DelegatedDialogResponse(prompt.variation(this.slots()));
                break;
            }
        }

        if (delegatedResponse) {
            return DialogOutput.delegatedResponse(delegatedResponse);
        }

        // dialog state is done if we get here - we do not need to return anything
        this._dialogState = DialogState.COMPLETED;
        if (this._dialogIntent.confirmationRequired) {
            delegatedResponse = new DelegatedDialogResponse(this.confirmationPrompt(this.slots()));
            return DialogOutput.delegatedResponse(delegatedResponse);
        }

        return DialogOutput.noop();
    }

}

export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    DENIED = "DENIED",
    NONE = "NONE",
}
