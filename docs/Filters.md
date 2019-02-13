# The Virtual Alexa Filter
One of the most useful features of VirtualAlexa [is the filter](https://bespoken.github.io/virtual-alexa/api/classes/virtualalexa.html#filter).

You can use the filter to intercept a request payload before it is sent to your skill and make changes to it.

We use this to handle test cases that are not handled more simply and elegantly yet by the tool.

## Example
For example, to work with Entity Resolution on slots, just set code like so:
```
reply = await alexa.filter(function (payload) {
    console.log("Payload: " + JSON.stringify(payload, null, 2));
    payload.request.intent.slots.City.resolutions = {
        resolutionsPerAuthority: [
            {
                authority: "amzn1.er-authority.echo-sdk.<skill-id>.AMAZON.US_CITY",
                status: {
                    code: "ER_SUCCESS_MATCH"
                },
                values: [
                    {
                        value: {
                            id: "ORD",
                            name: "the windy city"
                        }
                    }
                ]
            }
        ]
    }
})
alexa.utter("go to chicago");
```

The filter:
* Receives the payload with the request
* Sets the complex data necessary for the condition to be tested (in this case the Entity Resolution information)
* Takes effect once the `utter` call is made

## Resetting
To clear a filter when it is no longer needed, simply call [resetFilter()](https://bespoken.github.io/virtual-alexa/api/classes/virtualalexa.html#resetfilter).

The filter is very helpful for overcoming any roadblocks you might encounter in using VirtualAlexa.
