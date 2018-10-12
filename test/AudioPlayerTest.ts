import {assert} from "chai";
import {SkillResponse} from "../src/core/SkillResponse";
import {VirtualAlexa} from "../src/core/VirtualAlexa";

const interactionModel = {
    intents: [
        {
            name: "Ignore",
            samples: ["ignore"],
        },
        {
            name: "Play",
            samples: ["play", "play next", "play now"],
        },
        {
            name: "PlayUndefined",
            samples: ["play undefined"],
        },
        {
            name: "AMAZON.NextIntent",
        },
        {
            name: "AMAZON.PauseIntent",
        },
        {
            name: "AMAZON.PreviousIntent",
        },
        {
            name: "AMAZON.ResumeIntent",
        },
    ],
    types: [] as any[],
};

describe("AudioPlayer launches and plays a track", function() {
    it("Plays a track", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/SimpleAudioPlayer.handler")
            .interactionModel(interactionModel)
            .create();

        try {
            // We capture the requests being sent to virtual alexa
            // Because the AudioPlayer does some stuff internally automatically, want to ensure it is working properly
            const requests: any[] = [];
            virtualAlexa.filter((json) => {
                requests.push(json.request);
            });

            await virtualAlexa.launch();
            const reply = await virtualAlexa.utter("play") as SkillResponse;
            assert.include(reply.response.directives[0].audioItem.stream.url, "episode-013");
            assert.isTrue(virtualAlexa.audioPlayer().isPlaying());
        } catch (e) {
            console.log(e);
        }

    });

    it("Should not play an undefined track", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/SimpleAudioPlayer.handler")
            .interactionModel(interactionModel)
            .create();

        try {
            // We capture the requests being sent to virtual alexa
            // Because the AudioPlayer does some stuff internally automatically, want to ensure it is working properly
            const requests: any[] = [];
            virtualAlexa.filter((json) => {
                requests.push(json.request);
            });

            let result = await virtualAlexa.launch() as SkillResponse;
            assert.include(result.response.outputSpeech.ssml, "Welcome to the Simple Audio Player");

            result = await virtualAlexa.utter("play undefined") as SkillResponse;
        } catch (e) {
            assert.equal(e.message, "The URL specified in the Play directive must be defined and a valid HTTPS url");
            assert.equal(e.type, "INVALID_RESPONSE");
        }
    });

    it("Plays a track, next then previous", async () => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/SimpleAudioPlayer.handler")
            .interactionModel(interactionModel)
            .create();

        try {
            // We capture the requests being sent to virtual alexa
            // Because the AudioPlayer does some stuff internally automatically, want to ensure it is working properly
            const requests: any[] = [];
            virtualAlexa.filter((json) => {
                requests.push(json.request);
            });

            let result = await virtualAlexa.launch() as SkillResponse;
            assert.include(result.response.outputSpeech.ssml, "Welcome to the Simple Audio Player");

            result = await virtualAlexa.utter("play") as SkillResponse;
            // Make sure playback started has been sent before the response is received
            assert.equal(requests.length, 3);
            assert.include(result.response.directives[0].audioItem.stream.url, "episode-013");

            result = await virtualAlexa.utter("next") as SkillResponse;
            assert.include(result.response.directives[0].audioItem.stream.url, "episode-012");
            // Make sure another playback started has been sent before the response is received
            assert.equal(requests[5].type, "AudioPlayer.PlaybackStarted");

            result = await virtualAlexa.utter("previous") as SkillResponse;
            assert.include(result.response.directives[0].audioItem.stream.url, "episode-013");

            // Make sure that audio stops and starts on an "ignored" intent
            result = await virtualAlexa.utter("ignore") as SkillResponse;

            assert.equal(requests[0].type, "LaunchRequest");
            assert.equal(requests[1].type, "IntentRequest");
            assert.equal(requests[2].type, "AudioPlayer.PlaybackStarted");
            assert.equal(requests[3].type, "AudioPlayer.PlaybackStopped");
            assert.equal(requests[4].type, "IntentRequest");
            assert.equal(requests[5].type, "AudioPlayer.PlaybackStarted");
            assert.equal(requests[6].type, "AudioPlayer.PlaybackStopped");
            assert.equal(requests[7].type, "IntentRequest");
            assert.equal(requests[8].type, "AudioPlayer.PlaybackStarted");
            // The ignored intent generates these requests
            assert.equal(requests[9].type, "AudioPlayer.PlaybackStopped");
            assert.equal(requests[10].type, "IntentRequest");
            assert.equal(requests[11].type, "AudioPlayer.PlaybackStarted");
            assert.equal(requests.length, 12);
        } catch (e) {
            assert.fail(e);
        }

    });
});
