export class SlotTypes {
    public types: ISlotType[];

    public constructor(slotTypes: any[]) {
        this.types = slotTypes;
    }

    public slotType(name: string): ISlotType {
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
            return new SlotMatch(true, value);
        }

        let match: SlotMatch = new SlotMatch(false);
        for (const slotValue of slotType.values) {
            if (slotValue.name.synonyms) {
                for (const synonym of slotValue.name.synonyms) {
                    if (synonym.toLowerCase() === value) {
                        match = new SlotMatch(true, slotValue.name.value, slotValue.id, synonym);
                        break;
                    }
                }
            } else {
                if (slotValue.name.value.toLowerCase() === value) {
                    match = new SlotMatch(true, slotValue.name.value);
                }
            }

            if (match.matches) {
                break;
            }
        }
        return match;
    }
}

export class SlotMatch {
    public constructor(public matches: boolean,
                       public slotValueName?: string,
                       public slotValueID?: string,
                       public slotValueSynonym?: string) {}
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
