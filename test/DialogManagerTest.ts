import {VirtualAlexa} from "../src/VirtualAlexa";
import {assert} from "chai";
import {SkillResponse} from "../src/SkillResponse";
import {DialogResponse} from "../src/DialogResponse";

process.on("unhandledRejection", (e: any) => {
    console.error(e);
});

describe("DialogManager tests", function() {
    it("Parses the interaction model and handles it correctly", (done) => {
        const virtualAlexa = VirtualAlexa.Builder()
            .handler("test/resources/dialogModel/dialog-index.handler")
            .interactionModelFile("test/resources/dialogModel/dialog-model.json")
            .create();

        virtualAlexa.intend("PetMatchIntent", { size: "big"}).then((response: SkillResponse) => {
            return virtualAlexa.intend("PetMatchIntent", { temperament: "watch"});
        }).then((dialogResponse: DialogResponse) => {
            assert.equal(dialogResponse.elicitation, "Do you prefer high energy or low energy dogs?");
            return virtualAlexa.intend("PetMatchIntent", { energy: "high"});
        }).then((skillResponse: SkillResponse) => {
            assert.equal(skillResponse.prompt(), "Done with dialog");
            done();
        });

    });
});