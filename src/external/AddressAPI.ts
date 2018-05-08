import * as nock from "nock";
import {Scope} from "nock";
import {SkillContext} from "../core/SkillContext";

export class AddressAPI {
    /** @internal */
    private static activeScope: Scope; // We keep the nock scope as a singleton - only one can be active at a time
    public constructor(private context: SkillContext) {
        this.reset();
    }

    public returnsFullAddress(address: IStreetAddress) {
        this.configure(200, address);
    }

    public returnsCountryAndPostalCode(address: ICountryAndPostalCode) {
        this.configure(200, address);
    }

    public insufficientPermissions() {
        this.configure(403, undefined);
    }

    public reset() {
        if (AddressAPI.activeScope) {
            AddressAPI.activeScope.persist(false);
        }
    }

    private configure(responseCode: number, payload?: any) {
        if (!nock.isActive()) {
            nock.activate();
        }

        // If the address API is configured, we set the device ID if one is not already set
        if (payload) {
            this.context.device().generatedID();
        }

        const baseURL = this.context.apiEndpoint() + ":443";
        AddressAPI.activeScope = nock(baseURL)
            .persist()
            .get("/v1/devices/" + this.context.device().id() + "/settings/address")
            .query(true)
            .reply(responseCode, JSON.stringify(payload, null, 2));
    }
}

export interface IAddress {}

export interface ICountryAndPostalCode extends IAddress {
    countryCode: string;
    postalCode: string;
}

export interface IStreetAddress extends IAddress {
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    city: string;
    countryCode: string;
    districtOrCounty: string;
    postalCode: string;
    stateOrRegion: string;
}