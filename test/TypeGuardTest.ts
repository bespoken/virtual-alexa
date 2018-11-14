import {assert} from "chai";
import { DelegatedDialogResponse, isDelegatedDialogResponse, isSkillResponse, SkillResponse } from "../src/Index";

describe("TypeGuardTest", function() {

    describe("isDelegatedDialogResponse typeGuard", function() {

        it("should be false with a SkillResponse", function() {
            // Arrange
            const aResponse = new SkillResponse({});

            // Act
            const predicateResult = isDelegatedDialogResponse(aResponse);

            // Assert
            assert.isFalse(predicateResult);
        });

        it("should be true with an instance of it's own constructor", function() {
            // Arrange
            const aResponse = new DelegatedDialogResponse("a prompt message");

            // Act
            const predicateResult = isDelegatedDialogResponse(aResponse);

            // Assert
            assert.isTrue(predicateResult);
        });
    });

    describe("isSkillResponse typeGuard", function() {

        it("should be false with a DelegatedDialogResponse", function() {
            // Arrange
            const aResponse = new DelegatedDialogResponse("a prompt message");

            // Act
            const predicateResult = isSkillResponse(aResponse);

            // Assert
            assert.isFalse(predicateResult);
        });

        it("should be true with an instance of it's own constructor", function() {
            // Arrange
            const aResponse = new SkillResponse({});

            // Act
            const predicateResult = isSkillResponse(aResponse);

            // Assert
            assert.isTrue(predicateResult);
        });
    });
});
