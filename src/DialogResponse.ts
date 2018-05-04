import {IResponse} from "./IResponse";
import {SkillIntent} from "./SkillIntent";
import {SkillResponse} from "./SkillResponse";

export class DialogResponse implements IResponse {
    public isDelegated() {
        return false;
    }
}

export class DelegatedDialogResponse extends DialogResponse {
    public constructor(public prompt?: string, public skillResponse?: SkillResponse) {
        super();
    }

    public isDelegated() {
        return true;
    }
}

export class ExplicitDialogResponse extends DialogResponse {
    public constructor(public transformedIntent: SkillIntent) {
        super();
    }
}