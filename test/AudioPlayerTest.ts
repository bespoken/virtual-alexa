import {assert} from "chai";
import {VirtualAlexa} from "../src/VirtualAlexa";

const interactionModel = {
    intents: [
        {
            name: "Play",
            samples: ["play", "play next", "play now"],
        },
        {
            name: "AMAZON.PauseIntent",
        },
        {
            name: "AMAZON.ResumeIntent",
        },
    ],
    types: [] as any[],
};

describe("AudioPlayer launches and plays a track", function() {
    it("Plays a track", async () => {
        const myFunction = function(event: any, context: any) {
            context.done(null, { custom: true });
        };

        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test.resources.SimpleAudioPlayer.handler")
            .interactionModel(interactionModel)
            .create();

        try {
            let reply = await virtualAlexa.launch();
            reply = await virtualAlexa.utter("play");
            virtualAlexa.audioPlayer().playbackStarted();
            virtualAlexa.audioPlayer().playbackNearlyFinished();
            virtualAlexa.audioPlayer().playbackFinished();

            assert.isTrue(reply.custom);
        } catch (e) {
            console.log(e);
        }

    });
});
