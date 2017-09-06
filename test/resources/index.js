exports.handler = function (event, context, callback) {
    var slot;
    if (event.request.intent && event.request.intent.slots) {
        var slotName = Object.keys(event.request.intent.slots)[0];
        slot = event.request.intent.slots[slotName];
    }
    context.done(null, { success: true, slot: slot });
}