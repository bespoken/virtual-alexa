import {assert} from "chai";
import * as https from "https";
import {VirtualAlexa} from "../src/core/VirtualAlexa";

describe("Test address API mocks", function() {
    it("Calls address API for full address", (done) => {
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken, event.context.System.device.deviceId)
                .then((response: any) => {
                assert.equal(response.payload.addressLine1, "address line 1");
                assert.equal(response.statusCode, 200);
                done();
            });
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().returnsFullAddress({
            addressLine1: "address line 1",
            addressLine2: "address line 2",
            addressLine3: "address line 3",
            city: "city",
            countryCode: "country code",
            districtOrCounty: "district",
            postalCode: "postal",
            stateOrRegion: "state",
        });

        virtualAlexa.launch().then();
    });

    it("Calls address API for country code", (done) => {
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken, event.context.System.device.deviceId)
                .then((response: any) => {
                    assert.isUndefined(response.payload.addressLine1);
                    assert.equal(response.payload.countryCode, "country code");
                    assert.equal(response.statusCode, 200);
                    done();
                });
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().returnsCountryAndPostalCode({
            countryCode: "country code",
            postalCode: "postal",
        });

        virtualAlexa.launch().then();
    });

    it("Calls with two different virtual alexas", (done) => {
        // Make sure that only one mock for the address API is active at a time
        let count = 0;
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken, event.context.System.device.deviceId)
                .then((response: any) => {
                    count++;
                    assert.isUndefined(response.payload.addressLine1);
                    assert.equal(response.payload.countryCode, "country code " + count);
                    assert.equal(response.statusCode, 200);
                    if (count === 2) {
                        done();
                    }
                });
        };

        let virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().returnsCountryAndPostalCode({
            countryCode: "country code 1",
            postalCode: "postal",
        });

        virtualAlexa.launch().then();

        virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().returnsCountryAndPostalCode({
            countryCode: "country code 2",
            postalCode: "postal",
        });

        virtualAlexa.launch().then();
    });

    it("Calls address API without permissions", (done) => {
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken, event.context.System.device.deviceId)
                .then((response: any) => {
                    assert.isUndefined(response.payload);
                    assert.equal(response.statusCode, 403);
                    done();
                });
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().insufficientPermissions();

        virtualAlexa.launch().then();
    });
});

function callAddressAPI(apiAccessToken: string, deviceID: string) {
    const authorization = "Bearer " + apiAccessToken;
    let payload: any;
    return new Promise((resolve, reject) => {
        const request = https.request({
            headers: {
                authorization,
            },
            host: "api.amazonalexa.com",
            method: "GET",
            path: "/v1/devices/" + deviceID + "/settings/address",
        }, (response) => {
            const statusCode = response.statusCode;
            response.setEncoding("utf8");

            response.on("data", (chunk) => {
                if (!payload) {
                    payload = "";
                }
                payload += chunk;
            });

            response.on("end", () => {
                if (payload) {
                    payload = JSON.parse(payload);
                }
                resolve({
                    payload,
                    statusCode,
                });
            });

        });
        request.end();
    });
}
