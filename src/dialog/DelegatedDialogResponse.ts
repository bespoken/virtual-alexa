import {SkillResponse} from "../core/SkillResponse";
import {DialogResponse} from "./DialogResponse";

export class DelegatedDialogResponse extends DialogResponse {
    public constructor(public prompt?: string, public skillResponse?: SkillResponse) {
        super();
    }

    public isDelegated() {
        return true;
    }
}
