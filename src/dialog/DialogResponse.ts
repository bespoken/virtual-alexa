import {IResponse} from "../core/IResponse";
import {SkillResponse} from "../core/SkillResponse";
import {UserIntent} from "../impl/UserIntent";

export class DialogResponse implements IResponse {
    public isDelegated() {
        return false;
    }
}
