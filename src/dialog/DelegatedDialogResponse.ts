import {IResponse} from "../core/IResponse";
import {SkillResponse} from "../core/SkillResponse";

export class DelegatedDialogResponse implements IResponse {
    public constructor(public prompt?: string, public skillResponse?: SkillResponse) {}
}
