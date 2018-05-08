import {UserIntent} from "../impl/UserIntent";
import {DialogResponse} from "./DialogResponse";

export class ExplicitDialogResponse extends DialogResponse {
    public constructor(public transformedIntent: UserIntent) {
        super();
    }
}