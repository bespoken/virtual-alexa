# Bespoken Virtual Device SDK
The Bespoken Virtual Device SDK allows for interacting with skills (and, soon, Actions) programmatically.

The Virtual Alexa class allows for easy interaction programmatically:

* Via Emulation
    * utter: Generates JSON as if the user said the given phrase
    * intend: Generates JSON as if the given intent was uttered

* Via AVS integration:
    * speak: Interacts directly with the Alexa Voice Service,
sending audio files directly to the service and returning the result.

## Why Do I Need This?
This library allows for easy testing of skills.

You can use it for:
1) Unit-testing - ensuring individual routines work correctly
2) Regression testing - ensuring the code as a whole works properly
3) Validation testing - ensuring your skill works correctly regardless of speech recognition anomalies

## How Do I Get It?
```
npm install bespoken-virtual --save
```

## How Do I Use It?
Easy! Just add a line of code like so:
```
const bvd = require("bespoken-virtual");
const alexa = bvd.VirtualAlexa.builder()
    .handler("index.handler") // Lambda function file and name
    .intentSchemaFile("./speechAssets/IntentSchema.json") // Path to IntentSchema.json
    .sampleUtterancesFile("./speechAssets/SampleUtterances.txt") // Path to SampleUtterances
    .create();

alexa.utter("play").then((payload) => {
    console.log("OutputSpeech: " + payload.response.outputSpeech.ssml);
    // Prints out returned SSML, e.g., "<speak> Welcome to my Skill </speak>"
});
```

That's all there is to getting started. Read the docs in more depth here.
