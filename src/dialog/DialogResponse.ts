import {IResponse} from "../core/IResponse";
import {UserIntent} from "../impl/UserIntent";
import {SkillResponse} from "../core/SkillResponse";

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