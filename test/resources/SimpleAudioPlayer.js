// This is only initialized when the Lambda is, so it is preserved across calls
// It is NOT a real database, but can be used for testing, as JavaScript Lambdas tend to live for a few hours
// Stay tuned for a more sophisticated example that uses DynamoDB
var lastPlayedByUser = {};
var podcastURL = "https://s3.amazonaws.com/cdn.dabblelab.com/audio/one-small-step-for-man.mp3";


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

    // On launch, we tell the user what they can do (Play audio :-))
    if (requestType === "LaunchRequest") {
        this.say("Welcome to the Simple Audio Player. Say Play to play some audio!", "You can say Play");

        // Handle Intents here - Play, Pause and Resume is all for now
    } else if (requestType === "IntentRequest") {
        var intent = this.event.request.intent;
        if (intent.name === "Play") {
            this.play(podcastURL, 0);

        } else if (intent.name === "AMAZON.PauseIntent") {
            // When we receive a Pause Intent, we need to issue a stop directive
            //  Otherwise, it will resume playing - essentially, we are confirming the user's action
            this.stop();

        } else if (intent.name === "AMAZON.ResumeIntent") {
            var lastPlayed = this.loadLastPlayed(userId);
            var offsetInMilliseconds = 0;
            if (lastPlayed !== null) {
                offsetInMilliseconds = lastPlayed.request.offsetInMilliseconds;
            }

            this.play(podcastURL, offsetInMilliseconds);
        }
    } else if (requestType === "AudioPlayer.PlaybackStopped") {
        // We save off the PlaybackStopped Intent, so we know what was last playing
        this.saveLastPlayed(userId, this.event);

        // We respond with just true to acknowledge the request
        this.context.succeed(true);
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
 * Plays a particular track, from specific offset
 * @param audioURL The URL to play
 * @param offsetInMilliseconds The point from which to play - we set this to something other than zero when resuming
 */
SimplePlayer.prototype.play = function (audioURL, offsetInMilliseconds) {
    var response = {
        version: "1.0",
        response: {
            outputSpeech: {
                type: "PlainText",
                text: "Playing the requested song."
            },
            card: {
                "type": "Simple",
                "title": "Play Audio",
                "content": "Playing the requested song."
            },
            reprompt: {
                outputSpeech: {
                    type: "PlainText",
                    text: null
                }
            },
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Play",
                    playBehavior: "REPLACE_ALL", // Setting to REPLACE_ALL means that this track will start playing immediately
                    audioItem: {
                        stream: {
                            url: audioURL,
                            token: "0", // Unique token for the track - needed when queueing multiple tracks
                            // expectedPreviousToken: null, // The expected previous token - when using queues, ensures safety
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



