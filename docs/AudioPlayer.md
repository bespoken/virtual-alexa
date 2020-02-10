# Virtual Alexa and the Audio Player
Virtual Alexa emulates the Alexa AudioPlayer interface.

It does this via:
* Maintaining internal state around what track is playing
* Automatically sending state management requests to your skill

## Handling Directives Returned By Requests
When your skill returns a directive telling the AudioPlayer to Stop or Start,
the emulator will automatically send another request corresponding to the directive.

For example, a AudioPlayer.Stop directive will cause an AudioPlayer.PlaybackStopped
request to be sent to your skill immediately after being received.

Similarly, an AudioPlayer.Play directive will cause an AudioPlayer.PlaybackStarted
request to be sent to your skill immediately after being received.

## Handling Intents While Playing
An important part of state management for the AudioPlayer is when the user speaks while audio is playing.

This causes the following sequence to occur:
* AudioPlayer.PlaybackStopped request is sent to your skill
* IntentRequest is sent to the skill corresponding to what the user said
* AudioPlayer.PlaybackStarted request is sent to your skill

This corresponds to the audio pausing when the user speaks, and then resuming once the interaction is completed.
[More information on this here](https://developer.amazon.com/docs/custom-skills/audioplayer-interface-reference.html#playbackstopped).

## Checking The Internal State
The internal state of the AudioPlayer can be inspected by calling:
* [virtualAlexa.audioPlayer.playing()](https://bespoken.github.io/virtual-alexa/api/classes/audioplayer.html#playing)
- Returns the current track playing
* [virtualAlexa.audioPlayer.playerActivity()](https://bespoken.github.io/virtual-alexa/api/classes/audioplayer.html#playerActivity)
- The current state of the AudioPlayer (PLAYING, IDLE, STOPPED, etc.)

## Example Unit Test
```
    const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.SimpleAudioPlayer.handler")
            .interactionModel(interactionModel)
            .create();

    // We capture the requests being sent to virtual alexa
    // Because the AudioPlayer does some stuff internally automatically, want to ensure it is working properly
    const requests: any[] = [];
    virtualAlexa.filter((json) => {
        requests.push(json.request);
    });

    let result = await virtualAlexa.launch();
    assert.include(result.response.outputSpeech.ssml, "Welcome to the Simple Audio Player");

    result = await virtualAlexa.utter("play");
    assert.include(result.response.directives[0].audioItem.stream.url, "episode-013");

    result = await virtualAlexa.utter("next");
    assert.include(result.response.directives[0].audioItem.stream.url, "episode-012");

    result = await virtualAlexa.utter("previous");
    assert.include(result.response.directives[0].audioItem.stream.url, "episode-013");

    // Make sure that audio stops and starts on an "ignored" intent
    result = await virtualAlexa.utter("ignore");

```
This is taken from our own internal unit test - [AudioPlayerTest.js](https://github.com/bespoken/virtual-alexa/blob/master/test/AudioPlayerTest.ts).

It is written with Mocha and Chai, but you can use any unit-testing framework that you like.

## Questions
Want to talk about testing the AudioPlayer? Contact us at [jpk@bespoken.io](mailto:jpk@bespoken.io)
or contact us on [Gitter](https://gitter.im/bespoken/virtual-alexa).
