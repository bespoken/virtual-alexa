import {VirtualAlexa} from "../src/VirtualAlexa";
import {assert} from "chai";
import {SkillResponse} from "../src/SkillResponse";
import {DialogResponse} from "../src/DialogResponse";

process.on("unhandledRejection", (e: any) => {
    console.error(e);
});

describe("DialogManager tests", function() {
    it("Interacts with delegated dialog", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: DialogResponse) => {
            assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
            assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });

    });

    it("Interacts with delegated dialog with confirmation", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
            return virtualAlexa.utter("yes");
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
            return virtualAlexa.utter("no");
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((dialogResponse: DialogResponse) => {
            return virtualAlexa.utter("yes");
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "You want a big high family dog?");
            virtualAlexa.filter((request) => {
                assert.equal(request.request.dialogState, "COMPLETED");
                assert.equal(Object.keys(request.request.intent.slots).length, 3);
                assert.equal(request.request.intent.slots.size.value, "big");
            });
            return virtualAlexa.utter("yes");
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });
    });

    it("Interacts with dialog with explicit handling", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-manual-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: DialogResponse) => {
            assert.equal(response.skillResponse.directive("Dialog.ElicitSlot").type, "Dialog.ElicitSlot");
            assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });

    });
});