# Virtual Alexa and the Display Interface
Virtual Alexa supports the display interface for emulating the Echo Show and Spot interactions.

## Selecting Elements
Enable Echo Show support by calling the method:
```
virtualAlexa.context().device().displaySupported(true);
```
This will cause requests to include the Display as a support interface.
 
Emulate user clicks on the screen by calling `selectElement` with the name of the token.

The SkillResponse also includes several useful helper methods, such as:
- [display()](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html#display) - Gets the template returned by the Display.RenderTemplate directive
- [primaryText()](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html#primaryText) - Get the primary text of the template or a ListItem (if a token is supplied)
- [secondaryText()](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html#secondaryText) - Get the secondary text of the template or a ListItem (if a token is supplied)
- [tertiaryText()](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html#tertiaryText) - Get the tertiary text of the template or a ListItem (if a token is supplied)
 
Check out the [full docs here](https://bespoken.github.io/virtual-alexa/api/classes/skillresponse.html).

## Examples
```javascript
    // Instantiate virtual alexa for test
    const virtualAlexa = VirtualAlexa.Builder()
        .handler("index.handler")
        .sampleUtterancesFile("./test/resources/SampleUtterances.txt")
        .intentSchemaFile("./test/resources/IntentSchema.json")
        .create();

    // Enable the display interface
    virtualAlexa.context().device().displaySupported(true);
    
    const response = virtualAlexa.launch((response) => {
        // Gets the template created as part of the Display.RenderTemplate directive
        assert.isDefined(response.display());
        
        // Checks the primary text of the text content of the template
        assert.equal(response.primaryText(), "PrimaryText");
        
        // Checks the primary text of the List Item with token "ListToken1"
        assert.equal(response.primaryText("ListToken1"), "ListItem1PrimaryText");
        assert.equal(response.secondaryText("ListToken2"), "ListItem2SecondaryText");
        assert.equal(response.tertiaryText("ListToken2"), "ListItem2TertiaryText");
    
        // Emulate the user selecting a list item
        return virtualAlexa.selectElement("ListToken1");
    }).then((response) => {
        assert.equal(response.prompt(), "Thanks for making a selection!");
    });
```