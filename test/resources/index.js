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
    context.done(null, response);
}