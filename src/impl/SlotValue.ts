import {SkillContext} from "../core/SkillContext";
import {ConfirmationStatus} from "../dialog/DialogManager";

export class SlotValue {
    public resolutions: { resolutionsPerAuthority: EntityResolution[] };

    public constructor(public name: string,
                       public value: string,
                       public confirmationStatus?: ConfirmationStatus) {}

    // TODO - probably do not need this block - look into taking this out
    public update(newSlot: SlotValue) {
        if (newSlot.value) {
            this.value = newSlot.value;
            this.resolutions = newSlot.resolutions;
            this.confirmationStatus = newSlot.confirmationStatus;
        }
    }

    public setEntityResolution(context: SkillContext, intentName: string) {
        const intent = context.interactionModel().intentSchema.intent(intentName);
        const slot = intent.slotForName(this.name);
        const slotType = context.interactionModel().slotTypes.slotType(slot.type);
        // We only include the entity resolution for builtin types if they have been extended
        //  and for all custom slot types
        if (slotType && slotType.isCustom()) {
            const authority = "amzn1.er-authority.echo-sdk." + context.applicationID() + "." + slotType.name;

            this.resolutions = { resolutionsPerAuthority: [] };
            const matches = slotType.matchAll(this.value);
            let customMatch = false;
            // Possible to have multiple matches, where we have overlapping synonyms
            for (const match of matches) {
                // If this is not a builtin value, we add the entity resolution
                if (match.enumeratedValue && !match.enumeratedValue.builtin) {
                    customMatch = true;
                    const entityResolution = new EntityResolution(authority,
                        EntityResolutionStatus.ER_SUCCESS_MATCH,
                        new EntityResolutionValue(match.enumeratedValue.id, match.enumeratedValue.name.value));
                    this.addEntityResolution(entityResolution);
                }
            }

            // Add a ER_SUCCESS_NO_MATCH record if there are no matches on custom values for the slot
            if (!customMatch) {
                const entityResolution = new EntityResolution(authority, EntityResolutionStatus.ER_SUCCESS_NO_MATCH);
                this.addEntityResolution(entityResolution);
            }
        }
    }

    private addEntityResolution(entityResolution: EntityResolution) {
        let alreadyResolved = false;
        for (const existingResolution of this.resolutions.resolutionsPerAuthority) {
            // If we already have a resolution for this lot, add this value to the list of values
            if (existingResolution.authority === entityResolution.authority) {
                existingResolution.values.push(entityResolution.values[0]);
                alreadyResolved = true;
            }
        }

        if (!alreadyResolved) {
            this.resolutions.resolutionsPerAuthority.push(entityResolution);
        }
    }
}

export class EntityResolution {
    public values: Array<{ value: EntityResolutionValue}> = [];
    public status: { code: EntityResolutionStatus };
    public constructor(public authority: string,
                       statusCode: EntityResolutionStatus,
                       value?: EntityResolutionValue) {
        if (value) {
            this.values.push({ value });
        }
        this.status = {
            code: statusCode,
        };
    }
}

export class EntityResolutionValue {
    public constructor(public id: string, public name: string) {}
}

export enum EntityResolutionStatus {
    ER_SUCCESS_MATCH = "ER_SUCCESS_MATCH",
    ER_SUCCESS_NO_MATCH = "ER_SUCCESS_NO_MATCH",
    ER_ERROR_TIMEOUT = "ER_ERROR_TIMEOUT",
    ER_ERROR_EXCEPTION = "ER_ERROR_EXCEPTION",
}
