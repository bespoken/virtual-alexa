import {assert} from "chai";
import {SkillResponse} from "../src/core/SkillResponse";
import {VirtualAlexa} from "../src/core/VirtualAlexa";
import { ConfirmationStatus } from "../src/dialog/DialogManager";

process.on("unhandledRejection", (e: any) => {
    console.error(e);
});

describe("DialogManager tests", function() {
    it("Interacts with delegated dialog", (done) => {
        
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        let request = virtualAlexa.request().intent("PetMatchIntent").slot("size", "big");
        assert.equal(request.json().request.dialogState, "STARTED");
        assert.equal(request.json().request.intent.slots.size.value, "big");
        assert.equal(request.json().request.intent.slots.size.resolutions.resolutionsPerAuthority.length, 1);
        virtualAlexa.call(request).then((response: SkillResponse) => {
            let request = virtualAlexa.request().intent("PetMatchIntent").slot("temperament", "watch");
            assert.equal(request.json().request.intent.slots.size.value, "big");
            assert.equal(request.json().request.intent.slots.temperament.value, "watch");
            assert.equal(request.json().request.intent.slots.temperament.resolutions.resolutionsPerAuthority.length, 1);
            return virtualAlexa.call(request);
        }).then(() => {
            done();
        });
    });

    it("Interacts with delegated dialog, version 2", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: SkillResponse) => {
            assert.equal(response.directive("Dialog.Delegate").type, "Dialog.Delegate");
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((response: SkillResponse) => {
            console.log("Response: " + JSON.stringify(response, null, 2));
            assert.equal(response.directive("Dialog.Delegate").type, "Dialog.Delegate");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((response: SkillResponse) => {
            assert.equal(response.directive("Dialog.Delegate").type, "Dialog.Delegate");
            done();
        });
    });

    // it("Interacts with delegated dialog with top-level interaction model element", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-index.handler")
    //         .interactionModelFile("test/resources/dialogModel/InteractionModelASK.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: DelegatedDialogResponse) => {
    //         assert.equal(response.skillResponse.directive("Dialog.Delegate").type, "Dialog.Delegate");
    //         assert.equal(response.prompt, "Are you looking for more of a family dog or a guard dog?");
    //         return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
    //         return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
    //     }).then((skillResponse: SkillResponse) => {
    //         assert.equal(skillResponse.prompt(), "Done with dialog");
    //         done();
    //     });
    // });

    // it("Interacts with delegated dialog with confirmation", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-index.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
    //         return virtualAlexa.utter("yes");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
    //         return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
    //         return virtualAlexa.utter("no");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
    //         return virtualAlexa.intend("PetMatchIntent", { temperament: "family"});
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
    //         return virtualAlexa.utter("yes");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Do you prefer high energy or low energy dogs?");
    //         return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "You want a big high family dog?");
    //         virtualAlexa.filter((request) => {
    //             assert.equal(request.request.dialogState, "COMPLETED");
    //             assert.equal(Object.keys(request.request.intent.slots).length, 12);
    //             assert.equal(request.request.intent.slots.size.value, "big");
    //         });
    //         return virtualAlexa.utter("yes");
    //     }).then((skillResponse: SkillResponse) => {
    //         assert.equal(skillResponse.prompt(), "Done with dialog");
    //         done();
    //     });
    // });

    // it("Send random intent on confirmation for delegated dialog", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-index.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
    //         return virtualAlexa.utter("stop");
    //     }).then((skillResponse: SkillResponse) => {
    //         assert.equal(skillResponse.response.shouldEndSession, true);
    //         done();
    //     });
    // });

    // it("Send random intent on slot for delegated dialog", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-index.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
    //         return virtualAlexa.utter("yes");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
    //         return virtualAlexa.utter("help");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         // Restarts the dialog - after sending the intent to the skill
    //         assert.isDefined(dialogResponse.skillResponse);
    //         assert.equal((dialogResponse.skillResponse as any).intent, "AMAZON.HelpIntent");
    //         done();
    //     });
    // });

    // it("Send utterance slot for delegated dialog", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-index.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model-confirmation.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a big dog?");
    //         return virtualAlexa.utter("yes");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you looking for more of a family dog or a guard dog?");
    //         return virtualAlexa.utter("family");
    //     }).then((dialogResponse: DelegatedDialogResponse) => {
    //         assert.equal(dialogResponse.prompt, "Are you sure you want a family dog?");
    //         done();
    //     });
    // });

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
            return virtualAlexa.call(virtualAlexa.request().intent("PetMatchIntent").slot("size", "small", ConfirmationStatus.CONFIRMED));
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

    // it("Interacts with non-delegated dialog with confirming intent confirmation", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-intent-confirmation.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent").then((skillResponse: SkillResponse) => {
    //         assert.equal(skillResponse.directive("Dialog.ConfirmIntent").type, "Dialog.ConfirmIntent");
    //         assert.include(skillResponse.prompt(), "Are you sure you want to do this?");
    //         return virtualAlexa.utter("yes");
    //     }).then((skillResponse: SkillResponse) => {
    //         assert.include(skillResponse.prompt(), "Done with dialog. I will do this.");
    //         done();
    //     });
    // });

    // it("Interacts with non-delegated dialog with denying intent confirmation", (done) => {
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler("test/resources/dialogModel/dialog-intent-confirmation.handler")
    //         .interactionModelFile("test/resources/dialogModel/dialog-model.json")
    //         .create();

    //     virtualAlexa.intend("PetMatchIntent").then((skillResponse: SkillResponse) => {
    //         assert.equal(skillResponse.directive("Dialog.ConfirmIntent").type, "Dialog.ConfirmIntent");
    //         assert.include(skillResponse.prompt(), "Are you sure you want to do this?");
    //         return virtualAlexa.utter("no");
    //     }).then((skillResponse: SkillResponse) => {
    //         assert.include(skillResponse.prompt(), "Done with dialog. I won't do this.");
    //         done();
    //     });
    // });

    // it("Cannot match slot type", (done) => {
    //     const model = {
    //         dialog: {
    //             intents: [
    //                 {
    //                     confirmationRequired: false,
    //                     name: "MissingSlotTypeIntent",
    //                     prompts: {},
    //                     slots: [
    //                         {
    //                             confirmationRequired: false,
    //                             elicitationRequired: true,
    //                             name: "missingSlotTypeSlot",
    //                             prompts: {},
    //                             type: "missingSlotType",
    //                         },
    //                         {
    //                             confirmationRequired: false,
    //                             elicitationRequired: true,
    //                             name: "goodSlot",
    //                             prompts: {},
    //                             type: "AMAZON.NUMBER",
    //                         },
    //                     ],
    //                 },
    //             ],
    //         },
    //         languageModel: {
    //             intents: [
    //                 {
    //                     name: "MissingSlotTypeIntent",
    //                     samples: [
    //                         "missing {missingSlotTypeSlot}", "number {goodSlot}",
    //                     ],
    //                     slots: [
    //                         {
    //                             name: "missingSlotTypeSlot",
    //                             type: "missingSlotType",
    //                         },
    //                         {
    //                             name: "goodSlot",
    //                             type: "AMAZON.NUMBER",
    //                         },
    //                     ],
    //                 },
    //             ],
    //             invocationName: "pet match",
    //             types: [] as any,
    //         },
    //         prompts: [] as any,
    //     };

    //     const handler = (event: any, context: any) => {
    //         const response = {
    //             directives: [
    //                 {
    //                     slotToElicit: "missingSlotTypeSlot",
    //                     type: "Dialog.ElicitSlot",
    //                     updatedIntent: {
    //                         confirmationStatus: "NONE",
    //                         name: "MissingSlotTypeIntent",
    //                     },
    //                 },
    //             ],
    //             outputSpeech: {
    //                 ssml: "SSML",
    //             },
    //         };
    //         context.succeed({ response: response });
    //     };
    //     const virtualAlexa = VirtualAlexa.Builder()
    //         .handler(handler)
    //         .interactionModel(model)
    //         .create();

    //     virtualAlexa.utter("number one").then((skillResponse: SkillResponse) => {
    //         return virtualAlexa.utter("untyped slot value");
    //     }).catch((e: Error) => {
    //         assert.equal(e.message, "No match in interaction model for slot type: " +
    //             "missingSlotType on slot: missingSlotTypeSlot");
    //         done();
    //     });
    // });
});
