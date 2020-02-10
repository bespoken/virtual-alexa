<p align="center">
  <a href="https://bespoken.io/">
    <img alt="Bespoken" src="https://bespoken.io/wp-content/uploads/Bespoken-Logo-RGB-e1500333659572.png" width="546">
  </a>
</p>

<p align="center">
  Virtual Alexa<br>
  Interact with skills intuitively and programmatically.
</p>

<p align="center">
    <a href="https://travis-ci.org/bespoken/virtual-alexa">
        <img alt="Build Status" class="badge" src="https://travis-ci.org/bespoken/virtual-alexa.svg?branch=master">
    </a>
    <a href="https://codecov.io/gh/bespoken/virtual-alexa">
      <img src="https://codecov.io/gh/bespoken/virtual-alexa/branch/master/graph/badge.svg" alt="Codecov" />
    </a>
    <a href="https://www.npmjs.com/package/virtual-alexa">
        <img alt="NPM Version" class="badge" src="https://img.shields.io/npm/v/virtual-alexa.svg">
    </a>
    <a href="https://bespoken.github.io/virtual-alexa/api/">
        <img alt="Docs" class="badge" src="https://img.shields.io/badge/docs-latest-success.svg">
    </a>
    <a href="https://gitter.im/bespoken/bst?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
        <img alt="Gitter" class="badge" src="https://badges.gitter.im/bespoken/bst.svg">
    </a>
</p>


# Virtual Alexa
Virtual Alexa allows for interacting with skills programmatically.

The core Virtual Alexa API provides several routines - the three most essential ones:
  
    * launch: Generates JSON for a launch request
    * intend: Generates JSON as if the given intent was uttered  
    * utter: Generates JSON as if the user said the given phrase  
    
And also check out our YAML Test Scripts. They allow for:
* End-to-end Testing (using our virtual devices)
* SMAPI Simulation-Based Testing (using the Skill Management API)
* Unit-Testing (using this library)

All via our simple, readable YAML syntax. [Read more here](https://read.bespoken.io).

**What's New In The Latest Version (0.7.x)**
* [Request Builder](https://bespoken.github.io/virtual-alexa/api/classes/skillrequest.html)
* [Improved Dialog Manager](https://github.com/bespoken/virtual-alexa/blob/master/docs/Dialog.md)
* More Internals - We've exposed more of the internal elements of Virtual Alexa, such as the AudioPlayer and DialogManager.

## Why Do I Need This?
This library allows for easy testing of skills.

You can use it for:

1) Unit-testing - ensuring individual routines work correctly  
2) Regression testing - ensuring the code as a whole works properly

## How Do I Get It?
```
npm install virtual-alexa --save-dev
```

## How Do I Use It?
Easy! Just add a line of code like so:
```javascript
const va = require("virtual-alexa");
const alexa = va.VirtualAlexa.Builder()
    .handler("index.handler") // Lambda function file and name
    .interactionModelFile("./models/en-US.json") // Path to interaction model file
    .create();

alexa.intend("PlayIntent").then((payload) => {
    console.log("OutputSpeech: " + payload.response.outputSpeech.ssml);
    // Prints out returned SSML, e.g., "<speak> Welcome to my Skill </speak>"
});
```

Our "canonical" full example is the [Super Simple Unit Testing project](https://github.com/bespoken/super-simple-unit-testing/blob/master/test/index-test.js).

### Virtual Alexa With Async/Await
Here are some basic tests that uses async/await:
```javascript
it("Accepts responses without dollars", async function () {
    const alexa = bvd.VirtualAlexa.Builder()
        .handler("index.handler") // Lambda function file and name
        .intentSchemaFile("./speechAssets/IntentSchema.json") // Uses old-style intent schema
        .sampleUtterancesFile("./speechAssets/SampleUtterances.txt")
        .create();

    const launchResponse = await alexa.launch();
    assert.include(launchResponse.response.outputSpeech.ssml, "Welcome to guess the price");

    const playerOneResponse = await alexa.intend("NumberIntent", { number: "2" });
    assert.include(playerOneResponse.response.outputSpeech.ssml, "what is your name");
    assert.include(playerOneResponse.response.outputSpeech.ssml, "contestant one");

    const playerTwoResponse = await alexa.intend("NameIntent", { name: "john" });
    assert.include(playerTwoResponse.response.outputSpeech.ssml, "what is your name");
    assert.include(playerTwoResponse.response.outputSpeech.ssml, "Contestant 2");

    const gameStartResponse =  await alexa.intend("NameIntent", { name: "juan" });
    assert.include(gameStartResponse.response.outputSpeech.ssml, "let's start the game");
    assert.include(gameStartResponse.response.outputSpeech.ssml, "Guess the price");

    const priceGuessResponse = await alexa.intend("NumberIntent", { number: "200" });
    assert.include(priceGuessResponse.response.outputSpeech.ssml, "the actual price was");
});
```
This one is using Mocha (and Babel) - you can see the full example here:  
https://github.com/bespoken/GuessThePrice/blob/ProgrammaticTests/test/index-test.js

### Virtual Alexa With Promises
Here's an example using promises:
```javascript
test("Plays once", (done) => {
    alexa.intend("GetStartedIntent").then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("What is the search term for it");
        return alexa.intend("IncorrectGuessIntent");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Nice try");
        return alexa.intend("IncorrectGuessIntent");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("That is not correct");
        return alexa.intend("IncorrectGuessIntent");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
        done();

    });
});
```
You can see the full example this is taken from here:  
https://github.com/bespoken/giftionary/blob/master/test/index.test.js

And read all the docs here:  
https://bespoken.github.io/virtual-alexa/api/

## Using The Request Filter
The [filter](https://bespoken.github.io/virtual-alexa/api/classes/virtualalexa.html#filter) is a powerful tool for manipulating the request payloads that are made to your Alexa skill.
```javascript
alexa.filter((requestJSON) => {
  // Do something with the request
  requestJSON.request.locale = "en-US" // Arbitrary example of changing the request payload
});
```

More info on using it [here](docs/Filters.md).

## Using the request builder:
Our request builder allows for fine-tuning requests with ease.

To use it, make a call to Virtual Alexa like so:
```javascript
// Construct the request

const request = alexa.request()
    .intent("MyIntentName")
    .slot("SlotName", "SlotValue")
    .dialogState("COMPLETED")
    // Directly set any property on the JSON easily with the new set method
    .set("context.System.user.permissions.consentToken", "<TOKEN>")
    .set("context.System.device.deviceId", "<MY_DEVICE_ID>");

const response = await request.send();
```

[Read more here](https://bespoken.github.io/virtual-alexa/api/classes/skillrequest.html).

## AudioPlayer Interface
We also support the AudioPlayer! [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/AudioPlayer.md).

## Display Interface
We also support the Display Interface! [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Display.md).

## Dialog Interface
We also support the Dialog Interface. [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Dialog.md).

Using our implementation, you can simulate different payloads coming from the Dialog Manager with ease.

# In-Skill Purchase Responses
You can emulate responses from an In-Skill Purchase with the following request type:
```
const request = alexa.request().inSkillPurchaseResponse(
    "Buy",
    "ACCEPTED",
    "MyProductId",
    "MyToken"
);

const response = await request.send();
```

## Mocking External Calls (Dynamo and Address API)
We also support mocking external calls, such as ones made to the Address API and Dynamo.
[Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Externals.md).

This allows for testing without relying on the actual calls, which are difficult if not impossible to configure for unit tests.

## Entity Resolution
We support the entity resolution request payloads.

Using Virtual Alexa, we will automatically add entity resolution information to your slots, based on the your interaction model. It's like magic :-)

[Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/EntityResolution.md).

## How Do I Talk To You?
Easy, find us on [our Gitter](https://gitter.im/bespoken/virtual-alexa) or email [support@bespoken.io](mailto:support@bespoken.io).

We look forward to hearing from you!
