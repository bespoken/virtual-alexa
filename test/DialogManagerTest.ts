import {assert} from "chai";
import {SkillResponse} from "../src/core/SkillResponse";
import {VirtualAlexa} from "../src/core/VirtualAlexa";
import {DelegatedDialogResponse} from "../src/dialog/DelegatedDialogResponse";

process.on("unhandledRejection", (e: any) => {
    console.error(e);
});

describe("DialogManager tests", function() {
    it("Interacts with delegated dialog", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: DelegatedDialogResponse) => {
            assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
            assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });
    });

    it("Interacts with delegated dialog with top-level interaction model element", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/InteractionModelASK.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: DelegatedDialogResponse) => {
            assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
            assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((dialogResponse: DelegatedDialogResponse) => {
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

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
            return virtualAlexa.utter("yes");
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
            return virtualAlexa.utter("no");
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
            return virtualAlexa.utter("yes");
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "You want a big high family dog?");
            virtualAlexa.filter((request) => {
                assert.equal(request.request.dialogState, "COMPLETED");
                assert.equal(Object.keys(request.request.intent.slots).length, 12);
                assert.equal(request.request.intent.slots.size.value, "big");
            });
            return virtualAlexa.utter("yes");
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });
    });

    it("Send random intent on confirmation for delegated dialog", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
            return virtualAlexa.utter("stop");
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.response.shouldEndSession, true);
            done();
        });
    });

    it("Send random intent on slot for delegated dialog", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
            return virtualAlexa.utter("yes");
        }).then((dialogResponse: DelegatedDialogResponse) => {
            assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
            return virtualAlexa.utter("help");
        }).then((dialogResponse: DelegatedDialogResponse) => {
            // Restarts the dialog - after sending the intent to the skill
            assert.isDefined(dialogResponse.skillResponse);
            assert.equal((dialogResponse.skillResponse as any).intent, "AMAZON.HelpIntent");
            done();
        });
    });

    it("Interacts with dialog with explicit slot handling", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-manual-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.directive("Dialog.ElicitSlot").type, "Dialog.ElicitSlot");
            assert.include(skillResponse.prompt(), "Are you looking for a family dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Do you prefer high energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });
    });

    it("Interacts with dialog with explicit slot handling and confirmations", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-manual-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "small"}).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.directive("Dialog.ConfirmSlot").type, "Dialog.ConfirmSlot");
            assert.include(skillResponse.prompt(), "small?");
            virtualAlexa.filter((request) => {
                assert.equal(request.request.intent.slots.size.confirmationStatus, "CONFIRMED");
                assert.equal(request.request.intent.slots.size.value, "small");
            });
            return virtualAlexa.utter("yes");
        }).then((skillResponse: SkillResponse) => {
            virtualAlexa.resetFilter();
            assert.equal(skillResponse.directive("Dialog.ElicitSlot").type, "Dialog.ElicitSlot");
            assert.equal(skillResponse.prompt(), "Are you looking for a family dog?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Do you prefer high energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
        }).then((skillResponse: SkillResponse) => {
            done();
        });
    });
});
