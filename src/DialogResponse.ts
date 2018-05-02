import {IResponse} from "./IResponse";

export class DialogResponse implements IResponse {
    public constructor(public elicitation: string) {}
}