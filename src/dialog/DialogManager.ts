import {SkillContext} from "../core/SkillContext";
import {SkillRequest} from "../core/SkillRequest";
import {SkillResponse} from "../core/SkillResponse";
import {SlotValue} from "../impl/SlotValue";
import {BuiltinUtterances} from "../model/BuiltinUtterances";
import {DialogIntent} from "./DialogIntent";

export enum DialogState {
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS",
    STARTED = "STARTED",
}

export class DialogManager {
    private _delegated: boolean = false;
    private _dialogIntent: DialogIntent = undefined;
    private _confirmingSlot: SlotValue = undefined;
    private _confirmationStatus: ConfirmationStatus;
    private _dialogState: DialogState = undefined;
    private _slots: {[id: string]: any} = {};
    public constructor(public context: SkillContext) {}

    public handleDirective(response: SkillResponse): void {
        // Look for a dialog directive - trigger dialog mode if so
        for (const directive of response.response.directives) {
            if (directive.type.startsWith("Dialog")) {
                if (directive.updatedIntent) {
                    this._dialogIntent = this.context.interactionModel().dialogIntent(directive.updatedIntent.name);
                    if (!this.context.interactionModel().dialogIntent(directive.updatedIntent.name)) {
                        throw new Error("No match for dialog name: " + directive.updatedIntent.name);
                    }
                }

                this._dialogState = this._dialogState ? DialogState.IN_PROGRESS : DialogState.STARTED;
                    
                if (directive.type === "Dialog.Delegate") {
                    this._delegated = true;
                    this._confirmationStatus = ConfirmationStatus.NONE;
                } else if (directive.type === "Dialog.ElicitSlot"
                    || directive.type === "Dialog.ConfirmSlot"
                    || directive.type === "Dialog.ConfirmIntent") {
                    // Start the dialog if not started, otherwise mark as in progress
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
                        this._dialogState = DialogState.COMPLETED;
                    }
                }

            }
        }
    }

    public confirmationStatus() {
        return this._confirmationStatus;
    }

    public handleUtterance(utterance: string): SkillRequest {
        // If we are in confirmation mode, check if this is yes or no
        if (this._confirmingSlot || this._dialogState === DialogState.COMPLETED) {
            if (BuiltinUtterances.values()["AMAZON.YesIntent"].indexOf(utterance) !== -1) {
                return new SkillRequest(this.context).intent("AMAZON.YesIntent");
            } else if (BuiltinUtterances.values()["AMAZON.NoIntent"].indexOf(utterance) !== -1) {
                return new SkillRequest(this.context).intent("AMAZON.NoIntent");
            }
        } else if (this.isDialog()) {
            const providedSlots: any = {};
            let matched = false;
            // Loop through slot values looking for a match
            for (const slot of this._dialogIntent.slots) {
                const slotType = this.context.interactionModel().slotTypes.slotType(slot.type);
                if (!slotType) {
                    throw new Error("No match in interaction model for slot type: "
                        + slot.type + " on slot: " + slot.name);
                }

                const match = slotType.match(utterance);
                if (match.matches) {
                    matched = true;
                    providedSlots[slot.name] = match.value;
                }
            }

            if (matched) {
                return new SkillRequest(this.context).intent(this._dialogIntent.name).slots(providedSlots);
            }
        }
        return undefined;
    }

    public handleRequest(request: SkillRequest): void {
        const intentName = request.json().request.intent.name;
        if (this.context.interactionModel().dialogIntent(intentName)) {
            // Set the dialog intent here - it may not be set by the skill in its response
            this._dialogIntent = this.context.interactionModel().dialogIntent(intentName);

            // Make sure the dialog state is set to started
            if (!this._dialogState) {
                this._dialogState = DialogState.STARTED;
            }

            // Update the state of the slots in the dialog manager
            this.context.dialogManager().updateSlotStates(request.json().request.intent.slots);
        }
    }

    public isDelegated() {
        return this._delegated;
    }

    public isDialog() {
        return this._dialogState !== undefined;
    }

    public dialogState(state?: DialogState) {
        if (state) {
            this._dialogState = state;
        }
        return this._dialogState;
    }

    public reset() {
        this.dialogExited();
    }

    public slots() {
        return this._slots;
    }

    public updateSlot(slotName: string, newSlot: any) {
        const existingSlot = this._slots[slotName];
              
        // Update the slot value in the dialog manager if the intent has a new value
        if (!existingSlot) {
            this._slots[slotName] = newSlot;
        } else if (existingSlot && newSlot.value) {
            existingSlot.value = newSlot.value;
            existingSlot.resolutions = newSlot.resolutions;
            existingSlot.confirmationStatus = newSlot.confirmationStatus;
        }
    }

    public updateSlotStates(slots: {[id: string]: any}): void {
        if (!slots) {
            return;
        }

        //console.log("DIALOG SLOT PRE: " + JSON.stringify(slots, null, 2));
        for (const slotName of Object.keys(slots)) {
            const newSlot = slots[slotName];
            this.updateSlot(slotName, newSlot);
        }
    }

    private dialogExited(): void {
        this._confirmationStatus = undefined;
        this._delegated = false;
        this._dialogState = undefined;
        this._dialogIntent = undefined;
        this._slots = {};
    }
}

export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    DENIED = "DENIED",
    NONE = "NONE",
}
