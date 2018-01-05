import {InteractionModel} from "./InteractionModel";
import {ModuleInvoker} from "./ModuleInvoker";
import {SkillInteractor} from "./SkillInteractor";

export class LocalSkillInteractor extends SkillInteractor {
    public constructor(private handler: string | ((...args: any[]) => void),
                       protected model: InteractionModel,
                       locale: string,
                       applicationID?: string) {
        super(model, locale, applicationID);
    }

    protected invoke(requestJSON: any): Promise<any> {
        if (typeof this.handler === "string") {
            return ModuleInvoker.invokeHandler(this.handler, requestJSON);
        } else {
            return ModuleInvoker.invokeFunction(this.handler, requestJSON);
        }
    }
}
