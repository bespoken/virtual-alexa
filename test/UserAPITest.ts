import {assert} from "chai";
import * as https from "https";
import {VirtualAlexa} from "../src/core/VirtualAlexa";

describe("Test User API mocks", function() {
    it("Calls User API for one property", async () => {
        const myFunction = async function(event: any, context: any) {
            const response: any = await callUserAPI(event.context.System.apiAccessToken,"name");
            assert.equal(response.payload, "John Smith");
            assert.equal(response.statusCode, 200);

            const responseUnauthorized: any = await callUserAPI(event.context.System.apiAccessToken,"givenName");
            assert.isUndefined(responseUnauthorized.payload);
            assert.equal(responseUnauthorized.statusCode, 403);
            // we need to return a object response for virtual alexa
            return {};
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.userAPI().returnsUserProfile({
            name: "John Smith"
        });

        await virtualAlexa.launch();
    });

    it("Calls User API for multiple properties", async () => {
        const myFunction = async function(event: any, context: any) {
            const response: any = await callUserAPI(event.context.System.apiAccessToken,"name");
            assert.equal(response.payload, "John Smith");
            assert.equal(response.statusCode, 200);

            const responsePhoneNumber: any = await callUserAPI(event.context.System.apiAccessToken,"mobileNumber");
            assert.equal(responsePhoneNumber.payload.countryCode, "+1");
            assert.equal(responsePhoneNumber.payload.phoneNumber, "123456789");
            assert.equal(responsePhoneNumber.statusCode, 200);
            // we need to return a object response for virtual alexa
            return {};
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler(myFunction)
            .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
            .intentSchemaFile("./test/resources/IntentSchema.json")
            .create();

        virtualAlexa.userAPI().returnsUserProfile({
            name: "John Smith",
            mobileNumber: {
                countryCode: "+1",
                phoneNumber: "123456789"
            }
        });

        await virtualAlexa.launch();
    });
});

function callUserAPI(apiAccessToken: string, path: string) {
    const authorization = "Bearer " + apiAccessToken;
    let payload: any;
    return new Promise((resolve) => {
        const request = https.request({
            headers: {
                authorization,
            },
            host: "api.amazonalexa.com",
            method: "GET",
            path: "/v2/accounts/~current/settings/Profile." + path,
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
