import {DialogResponse} from "./DialogResponse";
import {SkillResponse} from "../core/SkillResponse";

export class DelegatedDialogResponse extends DialogResponse {
    public constructor(public prompt?: string, public skillResponse?: SkillResponse) {
        super();
    }

    public isDelegated() {
        return true;
    }
}
