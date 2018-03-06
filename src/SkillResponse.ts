import * as _ from "lodash";

/**
 * Wrapper object for the Alexa Response.
 *
 * Provides a number of convenience methods for accessing it.
 */
export class SkillResponse {
    public response: any;
    public sessionAttributes?: any;
    public version: string;

    public constructor(rawJSON: any) {
        this.wrapJSON(rawJSON);
    }

    /**
     * Gets the named key from the session attributes
     * @param {string} key
     * @returns {string}
     */
    public attr(key: string): string {
        return _.get(this.sessionAttributes, key);
    }

    /**
     * Gets the named set of keys from the session attributes - uses lodash "pick" function
     * @param {string} keys
     * @returns {any}
     */
    public attrs(...keys: string []): any {
        return _.pick(this.sessionAttributes, keys);
    }

    public card(): any | undefined {
        return _.get(this, "response.card");
    }

    public cardContent(): string | undefined {
        return _.get(this, "response.card.content");
    }

    public cardImage(): any {
        return _.get(this, "response.card.image");
    }

    public cardSmallImage(): string | undefined {
        return _.get(this, "response.card.image.smallImageUrl");
    }

    public cardLargeImage(): string | undefined {
        return _.get(this, "response.card.image.largeImageUrl");
    }

    public cardTitle(): string | undefined {
        return _.get(this, "response.card.title");
    }

    public directive(type: string): any {
        let o;
        if (this.response.directives) {
            for (const directive of this.response.directives) {
                if (directive.type === type) {
                    o = directive;
                    break;
                }
            }
        }
        return o;
    }

    public display(): any {
        return _.get(this.directive("Display.RenderTemplate"), "template");
    }

    /**
     * Returns the primary text for a display template
     * If token is specified, grabs a list value for a list template
     * @param {string} token
     * @returns {string | undefined}
     */
    public primaryText(listItemToken?: any): string | undefined {
        return this.displayText("primaryText", listItemToken);
    }

    /**
     * Returns the secondary text for a display template
     * If token is specified, grabs a list value for a list template
     * @param {string} token
     * @returns {string | undefined}
     */
    public secondaryText(listItemToken?: any): string | undefined {
        return this.displayText("secondaryText", listItemToken);
    }

    /**
     * Returns the tertiary text for a display template
     * If token is specified, grabs a list value for a list template
     * @param {string} token
     * @returns {string | undefined}
     */
    public tertiaryText(listItemToken?: any): string | undefined {
        return this.displayText("tertiaryText", listItemToken);
    }

    public prompt(): string | undefined {
        return _.has(this, "response.outputSpeech.ssml")
            ? _.get(this, "response.outputSpeech.ssml")
            : _.get(this, "response.outputSpeech.text");
    }

    public reprompt(): string {
        return _.has(this, "response.reprompt.outputSpeech.ssml")
            ? _.get(this, "response.reprompt.outputSpeech.ssml")
            : _.get(this, "response.reprompt.outputSpeech.text");
    }

    private wrapJSON(rawJSON: any) {
        for (const key of Object.keys(rawJSON)) {
            const value = rawJSON[key];
            (this as any)[key] = value;
        }
    }

    private displayText(textElement: string, listItemToken?: string): string | undefined {
        const displayTemplate = this.display();
        if (!displayTemplate) {
            return undefined;
        }

        if (listItemToken) {
            for (const listItem of displayTemplate.listItems) {
                if (listItem.token === listItemToken) {
                    return _.get(listItem, "textContent." + textElement + ".text");
                }
            }
        } else {
            const path = "textContent." + textElement + ".text";
            return _.get(displayTemplate, path);
        }
        return undefined;
    }
}
