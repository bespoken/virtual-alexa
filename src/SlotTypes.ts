export class SlotTypes {
    public types: SlotType[];

    public constructor(slotTypes: ISlotType[]) {
        this.types = [];
        for (const type of slotTypes) {
            this.types.push(new SlotType(type.name, type.values));
        }
    }

    public addTypes(slotTypes: SlotType[]) {
        this.types = this.types.concat(slotTypes);
    }

    public slotType(name: string): SlotType {
        let slotType;
        name = name.toLowerCase();
        for (const o of this.types) {
            if (o.name.toLowerCase() === name) {
                slotType = o;
                break;
            }
        }

        return slotType;
    }

    public matchesSlot(name: string, value: string): SlotMatch {
        value = value.toLowerCase().trim();
        const slotType = this.slotType(name);
        // If no slot type definition is provided, we just assume it is a match
        if (!slotType) {
            const match = new SlotMatch(true, value);
            match.untyped = true;
            return match;
        }

        return slotType.match(value);
    }
}

export class SlotMatch {
    public untyped: boolean;
    public constructor(public matches: boolean,
                       public slotValueName?: string,
                       public slotValueID?: string,
                       public slotValueSynonym?: string) {
        this.untyped = false;
    }
}

export class SlotType implements ISlotType {
    public constructor(public name: string, public values: ISlotValue[]) {}

    public match(value: string) {
        let match: SlotMatch = new SlotMatch(false);

        for (const slotValue of this.values) {
            // First check the name value - the value and the synonyms are both valid matches
            // Refer here for definitive rules:
            //  https://developer.amazon.com/docs/custom-skills/
            //      define-synonyms-and-ids-for-slot-type-values-entity-resolution.html
            if (slotValue.name.value.toLowerCase() === value) {
                match = new SlotMatch(true, slotValue.name.value);
            } else if (slotValue.name.synonyms) {
                for (const synonym of slotValue.name.synonyms) {
                    if (synonym.toLowerCase() === value) {
                        match = new SlotMatch(true, slotValue.name.value, slotValue.id, synonym);
                        break;
                    }
                }
            }

            if (match.matches) {
                break;
            }
        }
        return match;
    }
}

export interface ISlotType {
    name: string;
    values: ISlotValue[];
}

export interface ISlotValue {
    id?: string;
    name: ISlotValueName;
}

export interface ISlotValueName {
    value: string;
    synonyms: string[];
}
