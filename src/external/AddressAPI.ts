import * as nock from "nock";
import {SkillContext} from "../core/SkillContext";

export class AddressAPI {
    /** @internal */
    private static activeScope: nock.Scope; // We keep the nock scope as a singleton - only one can be active at a time
    public constructor(private context: SkillContext) {
        this.reset();
    }

    /**
     * Causes the mock to return the specified full address to HTTP calls to the Address API
     * @param {IStreetAddress} address
     */
    public returnsFullAddress(address: IStreetAddress) {
        this.configure(200, "/settings/address/countryAndPostalCode", address);
        const countryAndPostalCode: ICountryAndPostalCode = {
            countryCode: address.countryCode,
            postalCode: address.postalCode,
        };
        this.configure(200, "/settings/address", countryAndPostalCode);
    }

    /**
     * Causes the mock to return the specified country and postal code to HTTP calls to the Address API
     * @param {IStreetAddress} address
     */
    public returnsCountryAndPostalCode(address: ICountryAndPostalCode) {
        this.configure(200, "/settings/address/countryAndPostalCode", address);
        this.configure(403, "/settings/address");
    }

    /**
     * Causes the mock to return a 403 error to HTTP calls to the Address API
     * This simulates a user not granting proper permissions
     */
    public insufficientPermissions() {
        this.configure(403, "/settings/address/countryAndPostalCode");
        this.configure(403, "/settings/address");
    }

    public reset() {
        if (AddressAPI.activeScope) {
            AddressAPI.activeScope.persist(false);
        }
    }

    private configure(responseCode: number, pathEnd: string, payload?: any) {
        if (!nock.isActive()) {
            nock.activate();
        }

        // If the address API is configured, we set the device ID if one is not already set
        if (payload) {
            this.context.device().generatedID();
        }

        const baseURL = this.context.apiEndpoint();
        AddressAPI.activeScope = nock(baseURL)
            .persist()
            .get("/v1/devices/" + this.context.device().id() + pathEnd)
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
