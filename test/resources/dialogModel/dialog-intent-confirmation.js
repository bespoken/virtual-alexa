exports.handler = (event, context) => {
    const { intent } = event.request

    let response
    if (intent && intent.confirmationStatus !== 'CONFIRMED') {
        if (intent && intent.confirmationStatus !== 'DENIED') {
            response = {
                response: {
                    directives: [{
                        updatedIntent: {
                            name: 'PetMatchIntent',
                            confirmationStatus: 'NONE',
                        },
                        type: 'Dialog.ConfirmIntent'
                    }],
                    outputSpeech: {
                        ssml: 'Are you sure you want to do this?'
                    }
                }
            }
        } else {
            response = {
                response: {
                    outputSpeech: {
                        ssml: "Done with dialog. I won't do this."
                    }
                }
            }
        }
    } else {
        response = {
            response: {
                outputSpeech: {
                    ssml: 'Done with dialog. I will do this.'
                }
            }
        }
    }

    if (intent) {
        response.intent = intent.name
    }

    // We increment a counter in our session every time for testing purposes
    let sessionCounter = 0
    if (event.session && event.session.attributes && event.session.attributes.counter !== undefined) {
        sessionCounter = event.session.attributes.counter
        sessionCounter += 1
    }

    response.sessionAttributes = {
        counter: sessionCounter,
        sessionId: event.session.sessionId
    }
    if (event.request.intent && event.request.intent.name === 'AMAZON.StopIntent') {
        response.response = {
            shouldEndSession: true
        }
    }
    context.done(null, response)
}