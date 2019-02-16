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
    <a href="https://gitter.im/bespoken/bst?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
        <img alt="Gitter" class="badge" src="https://badges.gitter.im/bespoken/bst.svg">
    </a>
</p>


# Virtual Alexa
Virtual Alexa allows for interacting with skills programmatically.

The core Virtual Alexa API provides several routines - the three most essential ones:
  
    * launch: Generates JSON for a launch request
    * utter: Generates JSON as if the user said the given phrase  
    * intend: Generates JSON as if the given intent was uttered  

**What's New In 2.0**
* [Request Builder](https://bespoken.github.io/virtual-alexa/api/classes/skillrequest.html)
* [Improved Dialog Manager](/bespoken/virtual-alexa/blob/master/docs/Dialog.md)
* More Internals - We've exposed more of the internal elements of Virtual Alexa, such as the AudioPlayer and

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
```
const va = require("virtual-alexa");
const alexa = va.VirtualAlexa.Builder()
    .handler("index.handler") // Lambda function file and name
    .interactionModelFile("./models/en-US.json") // Path to interaction model file
    .create();

alexa.utter("play").then((payload) => {
    console.log("OutputSpeech: " + payload.response.outputSpeech.ssml);
    // Prints out returned SSML, e.g., "<speak> Welcome to my Skill </speak>"
});
```

Our "canonical" full example is the [Super Simple Unit Testing project](https://github.com/bespoken/super-simple-unit-testing/blob/master/test/index-test.js).

### Virtual Alexa With Promises
Here's a more in-depth example, in the form of a Jest unit test:
```
test("Plays once", (done) => {
    alexa.utter("get started").then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("What is the search term for it");
        return alexa.utter("incorrect guess");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Nice try");
        return alexa.utter("incorrect guess");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("That is not correct");
        return alexa.utter("incorrect guess");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
        done();

    });
});
```
You can see the full example this is taken from here:  
https://github.com/bespoken/giftionary/blob/master/test/index.test.js

### Virtual Alexa With Async/Await
And here is one that uses async/await (which makes it even more readable):
```
it("Accepts responses without dollars", async function () {
    const alexa = bvd.VirtualAlexa.Builder()
        .handler("index.handler") // Lambda function file and name
        .intentSchemaFile("./speechAssets/IntentSchema.json") // Uses old-style intent schema
        .sampleUtterancesFile("./speechAssets/SampleUtterances.txt")
        .create();

    const launchResponse = await alexa.launch();
    assert.include(launchResponse.response.outputSpeech.ssml, "Welcome to guess the price");

    const playerOneResponse = await alexa.utter("2");
    assert.include(playerOneResponse.response.outputSpeech.ssml, "what is your name");
    assert.include(playerOneResponse.response.outputSpeech.ssml, "contestant one");

    const playerTwoResponse = await alexa.utter("john");
    assert.include(playerTwoResponse.response.outputSpeech.ssml, "what is your name");
    assert.include(playerTwoResponse.response.outputSpeech.ssml, "Contestant 2");

    const gameStartResponse =  await alexa.utter("juan");
    assert.include(gameStartResponse.response.outputSpeech.ssml, "let's start the game");
    assert.include(gameStartResponse.response.outputSpeech.ssml, "Guess the price");

    const priceGuessResponse = await alexa.utter("200");
    assert.include(priceGuessResponse.response.outputSpeech.ssml, "the actual price was");
});
```
This one is using Mocha (and Babel) - you can see the full example here:  
https://github.com/bespoken/GuessThePrice/blob/master/test/index-test.js

And read all the docs here:  
https://bespoken.github.io/virtual-alexa/api/
## Using The Request Filter
The [filter](https://bespoken.github.io/virtual-alexa/api/classes/virtualalexa.html#filter) is a powerful tool for manipulating the request payloads that are made to your Alexa skill.
```
alexa.filter((requestJSON) => {
  // Do something with the request
  requestJSON.request.locale = "en-US" // Arbitrary example of changing the request payload
});
```

More info on using it [here](docs/Filters.md).

## AudioPlayer Interface
We also support the AudioPlayer! [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/AudioPlayer.md).

## Display Interface
We also support the Display Interface! [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Display.md).

## Dialog Interface
**NEW** We also support the Dialog Interface. [Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Dialog.md).

## Mocking External Calls (Dynamo and Address API)
**NEW** We also support mocking external calls, such as ones made to the Address API and Dynamo.
[Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/Externals.md).

This allows for testing without relying on the actual calls, which are difficult if not impossible to configure for unit tests.

## Entity Resolution
**NEW** We support the entity resolution request payloads.
[Read more here](https://github.com/bespoken/virtual-alexa/blob/master/docs/EntityResolution.md).

## How Do I Talk To You?
Easy, you can open [an issue here](https://github.com/bespoken/virtual-alexa/issues), or find us on [our Gitter](https://gitter.im/bespoken/virtual-alexa).

We are also on the [Alexa Slack channel](http://amazonalexa.slack.com) - @jpkbst, @jperata, @chrisramon and @ankraiza.

We look forward to hearing from you!
