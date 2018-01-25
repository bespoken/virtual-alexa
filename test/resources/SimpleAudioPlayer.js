// This is only initialized when the Lambda is, so it is preserved across calls
// It is NOT a real database, but can be used for testing, as JavaScript Lambdas tend to live for a few hours
// Stay tuned for a more sophisticated example that uses DynamoDB
var lastPlayedByUser = {};

var podcastFeed = [
    "https://feeds.soundcloud.com/stream/323049941-user-652822799-episode-013-creating-alexa-skills-using-bespoken-tools-with-john-kelvie.mp3",
    "https://feeds.soundcloud.com/stream/318108640-user-652822799-episode-012-alexa-skill-certification-with-sameer-lalwanilexa-dev-chat-final-mix.mp3",
    "https://feeds.soundcloud.com/stream/314247951-user-652822799-episode-011-alexa-smart-home-partner-network-with-zach-parker.mp3",
    "https://feeds.soundcloud.com/stream/309340878-user-652822799-episode-010-building-an-alexa-skill-with-flask-ask-with-john-wheeler.mp3"
];

// Entry-point for the Lambda
exports.handler = function(event, context) {
    var player = new SimplePlayer(event, context);
    player.handle();
};

// The SimplePlayer has helpful routines for interacting with Alexa, within minimal overhead
var SimplePlayer = function (event, context) {
    this.event = event;
    this.context = context;
};

// Handles an incoming Alexa request
SimplePlayer.prototype.handle = function () {
    var requestType = this.event.request.type;
    var userId = this.event.context ? this.event.context.System.user.userId : this.event.session.user.userId;
    var podcastIndex;

    // On launch, we tell the user what they can do (Play audio :-))
    if (requestType === "LaunchRequest") {
        this.say("Welcome to the Simple Audio Player. Say Play to play some audio!", "You can say Play");

        // Handle Intents here - Play, Next, Previous, Pause and Resume
    } else if (requestType === "IntentRequest") {
        var intent = this.event.request.intent;
        var lastPlayed = this.loadLastPlayed(userId);

        // We assume we start with the first podcast, but check the lastPlayed
        podcastIndex = indexFromEvent(lastPlayed);

        if (intent.name === "Play") {
            this.play(podcastFeed[podcastIndex], 0, "REPLACE_ALL", podcastIndex);

        } if (intent.name === "Ignore") {
            this.say("Ignoring", "You can say Play");

        } else if (intent.name === "AMAZON.NextIntent") {
            // If we have reached the end of the feed, start back at the beginning
            podcastIndex >= podcastFeed.length - 1 ? podcastIndex = 0 : podcastIndex++;

            this.play(podcastFeed[podcastIndex], 0, "REPLACE_ALL", podcastIndex);

        } else if (intent.name === "AMAZON.PreviousIntent") {
            // If we have reached the start of the feed, go back to the end
            podcastIndex == 0 ? podcastIndex = podcastFeed.length - 1 : podcastIndex--;

            this.play(podcastFeed[podcastIndex], 0, "REPLACE_ALL", podcastIndex);

        } else if (intent.name === "AMAZON.PauseIntent") {
            // When we receive a Pause Intent, we need to issue a stop directive
            //  Otherwise, it will resume playing - essentially, we are confirming the user's action
            this.stop();

        } else if (intent.name === "AMAZON.ResumeIntent") {
            var offsetInMilliseconds = 0;
            if (lastPlayed !== null) {
                offsetInMilliseconds = lastPlayed.request.offsetInMilliseconds;
            }

            this.play(podcastFeed[podcastIndex], offsetInMilliseconds, "REPLACE_ALL", podcastIndex);
        }
    } else if (requestType === "AudioPlayer.PlaybackNearlyFinished") {
        var lastIndex = indexFromEvent(this.event);
        podcastIndex = lastIndex;

        // If we have reach the end of the feed, start back at the beginning
        podcastIndex >= podcastFeed.length - 1 ? podcastIndex = 0 : podcastIndex++;

        // Enqueue the next podcast
        this.play(podcastFeed[podcastIndex], 0, "ENQUEUE", podcastIndex, lastIndex);

    } else if (requestType === "AudioPlayer.PlaybackStarted") {
        // We simply respond with true to acknowledge the request
        this.context.succeed(true);

    } else if (requestType === "AudioPlayer.PlaybackStopped") {
        // We save off the PlaybackStopped Intent, so we know what was last playing
        this.saveLastPlayed(userId, this.event);

        // We respond with just true to acknowledge the request
        this.context.succeed(true);
    } else if (requestType === "SessionEndedRequest") {
        var response = {
            version: "1.0",
            response: {
                shouldEndSession: true
            }
        };
        // We respond with just true to acknowledge the request
        this.context.succeed(response);
    }
};

/**
 * Creates a proper Alexa response using Text-To-Speech
 * @param message
 * @param repromptMessage
 */
SimplePlayer.prototype.say = function (message, repromptMessage) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: false,
            outputSpeech: {
                type: "SSML",
                ssml: "<speak> " + message + " </speak>"
            },
            reprompt: {
                outputSpeech: {
                    type: "SSML",
                    ssml: "<speak> " + repromptMessage + " </speak>"
                }
            }
        }
    };
    this.context.succeed(response);
};

/**
 * Plays a particular track for playback, either now or after the current track finishes
 * @param audioURL The URL to play
 * @param offsetInMilliseconds The point from which to play - we set this to something other than zero when resuming
 * @param playBehavior Either REPLACE_ALL, ENQUEUE or REPLACE_ENQUEUED
 * @param token An identifier for the track we are going to play next
 * @param previousToken This should only be set if we are doing an ENQUEUE or REPLACE_ENQUEUED
 */
SimplePlayer.prototype.play = function (audioURL, offsetInMilliseconds, playBehavior, token, previousToken) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Play",
                    playBehavior: playBehavior,
                    audioItem: {
                        stream: {
                            url: audioURL,
                            token: token, // Unique token for the track - needed when queueing multiple tracks
                            expectedPreviousToken: previousToken, // The expected previous token - when using queues, ensures safety
                            offsetInMilliseconds: offsetInMilliseconds
                        }
                    }
                }
            ]
        }
    };

    this.context.succeed(response);
};

// Stops the playback of Audio
SimplePlayer.prototype.stop = function () {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Stop"
                }
            ]
        }
    };

    this.context.succeed(response);
};

// Saves information into our super simple, not-production-grade cache
SimplePlayer.prototype.saveLastPlayed = function (userId, lastPlayed) {
    lastPlayedByUser[userId] = lastPlayed;
};

// Load information from our super simple, not-production-grade cache
SimplePlayer.prototype.loadLastPlayed = function (userId) {
    var lastPlayed = null;
    if (userId in lastPlayedByUser) {
        lastPlayed = lastPlayedByUser[userId];
    }
    return lastPlayed;
};

var indexFromEvent = function(event) {
    var index = 0;
    if (event) {
        // Turn it into an index - we will add or subtract if the user said next or previous
        index = parseInt(event.request.token);
    }
    return index;
};
