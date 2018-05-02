export class SlotPrompt {
    public static fromJSON(json: any): SlotPrompt {
        const prompt = new SlotPrompt();
        Object.assign(prompt, json);
        return prompt;
    }

    public id: string;
    public variations: SlotVariation[];

    public variation() {
        return this.variations[0];
    }
}

export class SlotVariation {
    public type: string;
    public value: string;
}
