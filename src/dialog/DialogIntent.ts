import {InteractionModel} from "../model/InteractionModel";
import {SlotPrompt} from "../model/SlotPrompt";

export class DialogIntent {
    public static fromJSON(interactionModel: InteractionModel, json: any): DialogIntent {
        const intent = new DialogIntent();
        Object.assign(intent, json);
        intent.slots = [];
        for (const slot of json.slots) {
            intent.addSlot(DialogSlot.fromJSON(intent, slot));
        }
        return intent;
    }

    public name: string;
    public confirmationRequired: boolean;
    public interactionModel: InteractionModel;
    public prompts: any;
    public slots: DialogSlot[];

    public addSlot(slot: DialogSlot) {
        this.slots.push(slot);
    }
}

export class DialogSlot {
    public static fromJSON(dialogIntent: DialogIntent, json: any) {
        const slot = new DialogSlot(dialogIntent);
        Object.assign(slot, json);
        return slot;
    }

    public name: string;
    public type: string;
    public elicitationRequired: boolean;
    public confirmationRequired: boolean;
    public prompts: { [id: string]: string };

    public constructor(public dialogIntent: DialogIntent) {}

    public elicitationPrompt(): SlotPrompt {
        const id = this.prompts.elicitation;
        return this.dialogIntent.interactionModel.prompt(id);
    }

    public confirmationPrompt(): SlotPrompt {
        const id = this.prompts.confirmation;
        return this.dialogIntent.interactionModel.prompt(id);
    }
}
