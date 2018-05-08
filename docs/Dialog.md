# Dialog Interface
Virtual Alexa supports the dialog interface, both for delegated and explicit slot handling.

## How It Works
Virtual Alexa internally manages the Dialog interactions.

If the skill delegates the Dialog handling to Alexa, 
Virtual Alexa will interact with the "user" as if they are 

## Delegated Dialogs
```javascript
 const virtualAlexa = VirtualAlexa.Builder()
    .handler("index.handler")
    .interactionModelFile("models/en-US.json")
    .create();

virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response) => {
    assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
    assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
    return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
}).then((dialogResponse) => {
    assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
    return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
}).then((skillResponse) => {
    assert.equal(skillResponse.prompt(), "Done with dialog");
    done();
});
```

When a user interaction is handled automatically by the dialog manager, 
it returns a [DelegatedDialogResponse](https://bespoken.github.io/virtual-alexa/api/classes/delegateddialogresponse.html) 
instead of a [SkillResponse](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html).

The skill response that initiated the dialog can still be found on the 
[skillResponse property](https://bespoken.github.io/virtual-alexa/api/classes/delegateddialogresponse.html#skillresponse) 
of the dialog response.

## Explicit Dialog Management
Explicit Dialog management works similar to "regular" skill interactions.

The dialog manager will internally track the state of the dialog. However, it is incumbent on the developer to issue directives for:  
* ElicitSlot
* ConfirmSlot
* ConfirmIntent

## General Dialog Management
The dialog manager of Virtual Alexa will handle passing the proper dialog state to the skill with each interaction.

Additionally, the dialog manager will update the state of the interaction based on any updateIntent directives.