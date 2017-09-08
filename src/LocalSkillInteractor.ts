import {InteractionModel} from "./InteractionModel";
import {ModuleInvoker} from "./ModuleInvoker";
import {SkillInteractor} from "./SkillInteractor";

export class LocalSkillInteractor extends SkillInteractor {
    public constructor(private handler: string, protected model: InteractionModel, applicationID?: string) {
        super(model, applicationID);
    }

    protected invoke(requestJSON: any): Promise<any> {
        return ModuleInvoker.invoke(this.handler, requestJSON);
    }
}
