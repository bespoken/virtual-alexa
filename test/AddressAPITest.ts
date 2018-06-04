import {assert} from "chai";
import * as https from "https";
import {VirtualAlexa} from "../src/core/VirtualAlexa";

describe("Test address API mocks", function() {
    it("Calls address API for full address", (done) => {
        const myFunction = function(event: any, context: any) {
            const promises = [];
            promises.push(callAddressAPI(event.context.System.apiAccessToken,
                event.context.System.device.deviceId,
                true)
                .then((response: any) => {
                    assert.equal(response.payload.addressLine1, "address line 1");
                    assert.equal(response.payload.countryCode, "country code");
                    assert.equal(response.statusCode, 200);
                }));

            promises.push(callAddressAPI(event.context.System.apiAccessToken,
                event.context.System.device.deviceId,
                false)
                .then((response: any) => {
                    assert.isUndefined(response.payload.addressLine1);
                    assert.equal(response.payload.countryCode, "country code");
                    assert.equal(response.statusCode, 200);
                }));
            Promise.all(promises).then(() => {
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

        virtualAlexa.launch();
    });

    it("Calls address API for country code", (done) => {
        const myFunction = function(event: any, context: any) {
            const promises = [];
            promises.push(callAddressAPI(event.context.System.apiAccessToken,
                event.context.System.device.deviceId,
                true)
                .then((response: any) => {
                    assert.isUndefined(response.payload.addressLine1);
                    assert.equal(response.payload.countryCode, "country code");
                    assert.equal(response.statusCode, 200);
                }));

            promises.push(callAddressAPI(event.context.System.apiAccessToken,
                event.context.System.device.deviceId,
                false)
                .then((response: any) => {
                    assert.equal(response.statusCode, 403);
                }));
            Promise.all(promises).then(() => {
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

        virtualAlexa.launch();
    });

    it("Calls with two different virtual alexas", (done) => {
        // Make sure that only one mock for the address API is active at a time
        let count = 0;
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken, event.context.System.device.deviceId, true)
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

        virtualAlexa.launch();

        virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.addressAPI().returnsCountryAndPostalCode({
            countryCode: "country code 2",
            postalCode: "postal",
        });

        virtualAlexa.launch();
    });

    it("Calls address API without permissions", (done) => {
        const myFunction = function(event: any, context: any) {
            callAddressAPI(event.context.System.apiAccessToken,
                event.context.System.device.deviceId)
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

        virtualAlexa.launch();
    });
});

function callAddressAPI(apiAccessToken: string, deviceID: string, countryCode: boolean = false) {
    let path = "/settings/address";
    if (countryCode) {
        path += "/countryAndPostalCode";
    }
    const authorization = "Bearer " + apiAccessToken;
    let payload: any;
    return new Promise((resolve) => {
        const request = https.request({
            headers: {
                authorization,
            },
            host: "api.amazonalexa.com",
            method: "GET",
            path: "/v1/devices/" + deviceID + path,
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
