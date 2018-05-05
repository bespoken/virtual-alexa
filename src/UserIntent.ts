import {ConfirmationStatus} from "./DialogManager";
import {InteractionModel} from "./InteractionModel";
import {EntityResolution, EntityResolutionStatus, EntityResolutionValue, SlotValue} from "./SlotValue";
import {ISlotValue} from "virtual-core";
import {SkillContext} from "./SkillContext";

export class UserIntent {
    public constructor(private context: SkillContext,
                       public name: string,
                       public providedSlotValues?: {[id: string]: string}) {}

    public slots(): {[id: string]: SlotValue} {
        // We combine the defined slots from the intent schema, with the provide slots with the utterance
        const slots: {[id: string]: SlotValue} = {};
        const intent = this.context.interactionModel().intentSchema.intent(this.name);
        if (!intent) {
            return slots;
        }

        const intentSlots = intent.slots;
        if (intentSlots) {
            for (const intentSlot of intentSlots) {
                slots[intentSlot.name] = new SlotValue(intentSlot.name,
                    undefined,
                    ConfirmationStatus.NONE);
            }
        }

        if (this.providedSlotValues && Object.keys(this.providedSlotValues).length > 0) {
            if (!intentSlots) {
                throw new Error("Trying to add slot to intent that does not have any slots defined");
            }

            for (const providedSlot of Object.keys(this.providedSlotValues)) {
                const targetSlot = slots[providedSlot];
                if (!targetSlot) {
                    throw new Error("Trying to add undefined slot to intent: " + providedSlot);
                }
                targetSlot.value = this.providedSlotValues[providedSlot];
                targetSlot.setEntityResolution(this.context, this.name);
            }
        }
        return slots;
    }
}
