import {DialogIntent} from "./DialogIntent";
import {SkillContext} from "../core/SkillContext";
import {SkillRequest} from "../core/SkillRequest";
import {SkillResponse} from "../core/SkillResponse";
import {SlotValue} from "../impl/SlotValue";

export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    DENIED = "DENIED",
    NONE = "NONE",
}

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

    /** @internal */
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

    /**
     * Set the confirmation status for the dialog
     * @param confirmationStatus 
     */
    public confirmationStatus(confirmationStatus: ConfirmationStatus) {
        if (confirmationStatus) {
            this._confirmationStatus = confirmationStatus;
        }
        return this._confirmationStatus;
    }

    /** @internal */
    public handleRequest(request: SkillRequest): void {
        const intentName = request.json().request.intent.name;
        if (this.context.interactionModel().dialogIntent(intentName)) {
            // Set the dialog intent here - it may not be set by the skill in its response
            this._dialogIntent = this.context.interactionModel().dialogIntent(intentName);

            // Make sure the dialog state is set to started
            if (!this._dialogState) {
                this._dialogState = DialogState.STARTED;
            }

            // Update the request JSON to have the correct dialog state
            request.json().request.dialogState = this._dialogState;

            // Update the state of the slots in the dialog manager
            this.context.dialogManager().updateSlotStates(request.json().request.intent.slots);
        }
    }

    /** @internal */
    public isDelegated() {
        return this._delegated;
    }

    /** @internal */
    public isDialog() {
        return this._dialogState !== undefined;
    }

    public reset() {
        this.dialogExited();
    }

    /** @internal */
    public slots() {
        return this._slots;
    }

    /**
     * Set the dialog state
     * @param state 
     */
    public state(state?: DialogState) {
        if (state) {
            this._dialogState = state;
        }
        return this._dialogState;
    }

    /** @internal */
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

    /** @internal */
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
