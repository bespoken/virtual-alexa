import {IResponse} from "./IResponse";
import {UserIntent} from "./UserIntent";
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
    public constructor(public transformedIntent: UserIntent) {
        super();
    }
}