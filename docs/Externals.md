# Virtual Alexa and External Calls
Virtual Alexa can mock external calls easily.

It handles:  
* Address API
* Dynamo (Coming Soon)
* List API

## Why Mocks?
We use mocks because it is either difficult or impossible to write unit tests with the **real** services.

For example, configuring local tests to use Dynamo requires:
* Setting up local AWS credentials
* Configuring Dynamo correctly
* Ensuring the database state is properly setup and reset after each test

By using a mock, we can bypass all this complexity - instead:
* The data never leaves the machine where it is being run
* The state is instantly reset between each test to a pristine condition
* The tests run extremely fast because no actual external calls are needed

For other calls, such as the Address API, it is essentially impossible to do without mocks.
This is because the Address API relies on a unique security token from Amazon, 
and the only way to get it is to be running inside Alexa. An emulator like Virtual Alexa just cannot do it.

## Address API
To mock the Address API with Virtual Alexa, simply supply the a desired return value to the [AddressAPI object](https://bespoken.github.io/virtual-alexa/api/classes/addressapi.html).

Example:
```javascript
const virtualAlexa = VirtualAlexa.Builder()
    .handler("index.handler")
    .interactionModelFile("models/en-US.json")
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
```

When your skill calls the Alexa API endpoint, 
a mock (setup using the terrific [Nock library](https://github.com/node-nock/nock) will intercept it and return the specified payload.

