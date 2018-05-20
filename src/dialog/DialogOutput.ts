import {UserIntent} from "../impl/UserIntent";
import {DelegatedDialogResponse} from "./DelegatedDialogResponse";

export class DialogOutput {
    public static delegatedResponse(response: DelegatedDialogResponse) {
        const o = new DialogOutput();
        o.delegatedDialogResponse = response;
        return o;
    }

    public static transformedIntent(userIntent: UserIntent) {
        const o = new DialogOutput();
        o.transformedIntent = userIntent;
        return o;
    }

    public static noop() {
        return new DialogOutput();
    }

    public delegatedDialogResponse?: DelegatedDialogResponse;
    public transformedIntent?: UserIntent;

    public delegated(): boolean {
        return this.delegatedDialogResponse !== undefined;
    }

    public transformed(): boolean {
        return this.transformedIntent !== undefined;
    }

    public noop(): boolean {
        return !this.transformed() && !this.delegated();
    }
}
