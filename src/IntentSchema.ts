import * as fs from "fs";

export class IntentSchema {
    public static fromFile(file: string): IntentSchema {
        const data = fs.readFileSync(file);
        const json = JSON.parse(data.toString());
        return IntentSchema.fromJSON(json);
    }

    public static fromJSON(schemaJSON: any): IntentSchema {
        return new IntentSchema(schemaJSON);
    }

    public constructor(public schemaJSON: any) {

    }

    public intents(): Intent[] {
        const intentArray: Intent[] = [];
        for (const intentJSON of this.schemaJSON.intents) {
            const intent = new Intent(intentJSON.intent);
            if (intentJSON.slots !== undefined && intentJSON.slots !== null) {
                for (const slotJSON of intentJSON.slots) {
                    intent.addSlot(new IntentSlot(slotJSON.name, slotJSON.type));
                }
            }
            intentArray.push(intent);
        }
        return intentArray;
    }

    public intent(intentString: string): Intent {
        let intent: Intent = null;
        for (const o of this.intents()) {
            if (o.name === intentString) {
                intent = o;
                break;
            }
        }
        return intent;
    }

    public hasIntent(intentString: string): boolean {
        return this.intent(intentString) !== null;
    }
}

export class Intent {
    public builtin: boolean = false;
    public slots: IntentSlot[] = null;
    public constructor(public name: string) {
        if (this.name.indexOf("AMAZON") !== -1) {
            this.builtin = true;
        }
    }

    public addSlot(slot: IntentSlot): void {
        if (this.slots === null) {
            this.slots = [];
        }

        this.slots.push(slot);
    }

    public slotForName(name: string): IntentSlot {
        for (const slot of this.slots) {
            if (name.toLowerCase() === slot.name.toLowerCase()) {
                return slot;
            }
        }
        return undefined;
    }
}

export class IntentSlot {
    public constructor(public name: string, public type: string) {}
}
