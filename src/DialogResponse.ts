import {IResponse} from "./IResponse";
import {SkillResponse} from "./SkillResponse";

export class DialogResponse implements IResponse {
    public constructor(public prompt: string, public skillResponse?: SkillResponse) {}
}