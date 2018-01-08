exports.handler = function (event, context, callback) {
    var slot;
    if (event.request.intent && event.request.intent.slots) {
        var slotName = Object.keys(event.request.intent.slots)[0];
        slot = event.request.intent.slots[slotName];
    }

    var response = { success: true, slot: slot };
    if (event.request.intent) {
        response.intent = event.request.intent.name;
    }

    // We increment a counter in our session every time for testing purposes
    var sessionCounter = 0;
    if (event.session && event.session.attributes && event.session.attributes.counter !== undefined) {
        sessionCounter = event.session.attributes.counter;
        sessionCounter++;
    }

    response.sessionAttributes = { counter: sessionCounter, sessionId: event.session.sessionId }
    if (event.request.intent && event.request.intent.name == "AMAZON.StopIntent") {
        response.response = { shouldEndSession: true };
    }
    context.done(null, response);
}