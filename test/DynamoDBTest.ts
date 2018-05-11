import {assert} from "chai";
const AWS = require("aws-sdk");
const db = require("../src/external/DynamoDB");
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "123456789";
process.env.AWS_SECRET_ACCESS_KEY = "123456789";

describe("Test dynamo DB mocks", function() {
    it("Adds a record to mock dynamo", (done) => {
        const mockDynamo = new db.DynamoDB();
        mockDynamo.mock();

        const dynamodb = new AWS.DynamoDB();
        const putParams = {
            Item: {
                AnArray: {
                    SS: ["Value1", "Value2", "Value3"],
                },
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

        const getParams = {
            Key: {
                ID: {
                    S: "IDValue",
                },
            },
            TableName: "FakeTable",
        };

        dynamodb.putItem(putParams, (error: any, data: any) => {
            assert.isNull(error);
            assert.isDefined(data);

            dynamodb.getItem(getParams, (getError: any, getData: any) => {
                assert.isNull(error);
                assert.equal(getData.Item.Artist.S, "No One You Know");
                // Dynamo seems to strip out the table name
                assert.isUndefined(getData.TableName);
                done();
            });
        });
    });
});
