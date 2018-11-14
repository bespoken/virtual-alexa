import {IResponse} from "../core/IResponse";
import {SkillResponse} from "../core/SkillResponse";

export class DelegatedDialogResponse implements IResponse {
    public responseType : IResponse["responseType"] = "DelegatedDialogResponse";

    public constructor(public prompt: string, public skillResponse?: SkillResponse) {}
}

export const isDelegatedDialogResponse = function(testObj : any) : testObj is DelegatedDialogResponse{
    // make sure that it is not falsy
    if(!testObj){
        return false;
    }
    // make sure that is an object
    if(typeof(testObj) === "object"){
        // now let's treat it as a Record/Dictionary because typescript wants to know that it has properties instead of being an empty object
        const testAsRecord: Record<string|number, any> = testObj;
        return (testAsRecord.responseType && testAsRecord.responseType === "DelegatedDialogResponse")
    } else {
        return false;
    }
}