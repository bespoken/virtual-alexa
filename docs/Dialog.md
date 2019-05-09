# Dialog Interface
Virtual Alexa supports the dialog interface, both for delegated and explicit slot handling.

Our support entails allowing for various dialog payloads to be easily constructed. This means:
* Setting slot values on intents correctly - this includes all slots for the intent, as well as confirmation status
* Managing the dialog state - initializing it in STARTED, moving to IN_PROGRESS
* Automatically populating entity resolution values on slots

**For unit-testing, it is important to keep in mind the goal is to ensure that code is working correctly.**
Our dialog manager will NOT emulate the mechanics of asking questions, including yes or no confirmations on slot values.
If that is desired, we recommend you take a look at our [end-to-end testing support](https://bespoken.io/end-to-end/getting-started). It works great for that purpose.

Instead, the goal of virtual alexa is to make it easy to emulate different skill request payloads to in turn ensure code is working perfectly.

Take a look at our sample project with programmatic dialog tests here:  
https://github.com/bespoken-samples/skill-sample-nodejs-petmatch/blob/master/lambda/custom/index-test.js

## How It Works
Virtual Alexa internally keeps track of the Dialog state, so that properties are properly set on the request JSON.

An example intent with dialog specific properties:
```javascript
let response = await virtualAlexa.request()
    .intent("PetMatchIntent")
    .slot("size", "big", "CONFIRMED")
    .dialogState("COMPLETED")
    .send();
```

## Delegated Dialogs
```javascript
 const virtualAlexa = VirtualAlexa.Builder()
    .handler("index.handler")
    .interactionModelFile("models/en-US.json")
    .create();

let response = await virtualAlexa.request()
    .intent("PetMatchIntent")
    .slot("size", "big", "CONFIRMED")
    .send();
assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");

response = await virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");

response = await virtualAlexa.request()
    .intent("PetMatchIntent", { energy: "high"})
    .dialogState("COMPLETED")
    .send();
assert.equal(skillResponse.prompt(), "Done with dialog");
done();
```

## Explicit Dialog Management
Explicit Dialog management works similar to "regular" skill interactions.

The dialog manager will internally track the state of the dialog. However, it is incumbent on the developer to issue directives for:  
* ElicitSlot
* ConfirmSlot
* ConfirmIntent

## General Dialog Management
The dialog manager of Virtual Alexa will handle passing the proper dialog state to the skill with each interaction.

Additionally, the dialog manager will update the state of the interaction based on any updateIntent directives.
