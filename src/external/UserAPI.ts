import * as nock from "nock";
import {SkillContext} from "../core/SkillContext";

export class UserAPI {
    /** @internal */
    private static scope: nock.Scope; // We keep the nock scope as a singleton - only one can be active at a time

    public constructor(private context: SkillContext) {
        this.reset();
    }

    public reset() {
        nock.cleanAll();
    }

    /**
     * Creates a object ready to be used by nock
     * @param {IUserProfile} userProfile
     * @param {string} property
     */
    private prepareNockResponse(userProfile: any, property: string): INockResponse {
        if (userProfile[property]) {
            return { responseCode: 200, payload: JSON.stringify(userProfile[property], null, 2)};
        }
        return {responseCode: 403}
    }


    /**
     * Sets the different properties in user profile as payload for the paths used in Alexa Profile Service
     * Paths mocked end with /v2/accounts/~current/settings/Profile.{key}
     * If the property is not present, returns a 403 error
     * @param {IUserProfile} userProfile
     */
    public returnUserProfile(userProfile: IUserProfile) {
        if (!nock.isActive()) {
            nock.activate();
        }

        const baseURL = this.context.apiEndpoint();
        let scope = nock(baseURL)
            .persist();

        // Alexa User Profile possible paths
        // Full Name	/v2/accounts/~current/settings/Profile.name
        // Given Name	/v2/accounts/~current/settings/Profile.givenName
        // Email Address	/v2/accounts/~current/settings/Profile.email
        // Phone Number	/v2/accounts/~current/settings/Profile.mobileNumber
        ["name", "givenName", "email", "mobileNumber"].forEach((key) => {
            const nockResponse = this.prepareNockResponse(userProfile, key);
            scope = scope
                    .get((path) => {
                        return path === ("/v2/accounts/~current/settings/Profile."  + key);
                    }).query(true)
                    .reply(nockResponse.responseCode, nockResponse.payload);
        });

        UserAPI.scope = scope;
    }
}

interface INockResponse {
    responseCode: number;
    payload?: string;
}

export interface IPhoneNumber {
    countryCode: string,
    phoneNumber: string,
}

export interface IUserProfile {
    name?: string,
    givenName?: string
    email?: string,
    mobileNumber?: IPhoneNumber
}
