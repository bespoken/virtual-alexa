import {InteractionModel} from "../model/InteractionModel";
import {ModuleInvoker} from "./ModuleInvoker";
import {SkillInteractor} from "./SkillInteractor";
import { VirtualAlexa } from "../core/VirtualAlexa";

export class LocalSkillInteractor extends SkillInteractor {
    public constructor(private handler: string | ((...args: any[]) => void)) {
        super();
    }

    protected invoke(requestJSON: any): Promise<any> {
        // If this is a string, means we need to parse it to find the filename and function name
        // Otherwise, we assume it is a function, and just invoke the function directly
        if (typeof this.handler === "string") {
            return ModuleInvoker.invokeHandler(this.handler, requestJSON);
        } else {
            return ModuleInvoker.invokeFunction(this.handler, requestJSON);
        }
    }
}
