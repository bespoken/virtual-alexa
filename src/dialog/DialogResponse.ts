import {IResponse} from "../core/IResponse";
import {UserIntent} from "../impl/UserIntent";
import {SkillResponse} from "../core/SkillResponse";

export class DialogResponse implements IResponse {
    public isDelegated() {
        return false;
    }
}