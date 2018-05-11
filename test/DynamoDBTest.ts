import {assert} from "chai";
const AWS = require("aws-sdk");
const db = require("../src/external/DynamoDB");
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "123456789";
process.env.AWS_SECRET_ACCESS_KEY = "123456789";

describe("Test dynamo DB mocks", function() {
    it("Adds a record to mock dynamo", (done) => {
        const mockDynamo = new db.DynamoDB();
        mockDynamo.activate();

        const dynamodb = new AWS.DynamoDB();
        const params = {
            Item: {
                Artist: {
                    S: "No One You Know",
                },
                ID: {
                    S: "IDValue",
                },
                SongTitle: {
                    S: "Call Me Today",
                },
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: "FakeTable",
        };

        dynamodb.putItem(params, (error: any, data: any) => {
            assert.isNull(error);
            assert.isDefined(data);
            const record = mockDynamo.fetch("FakeTable", { ID: "IDValue" });
            assert.equal(record.Item.Artist.S, "No One You Know");
            done();
        });
    });
});
