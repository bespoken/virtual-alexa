import {assert} from "chai";
const AWS = require("aws-sdk");
const db = require("../src/external/DynamoDB");

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

        assert.equal(process.env.AWS_REGION, "us-east-1");
        dynamodb.putItem(putParams, (error: any, data: any) => {
            assert.isNull(error);
            assert.isDefined(data);

            dynamodb.getItem(getParams, (getError: any, getData: any) => {
                assert.isNull(error);
                assert.equal(getData.Item.Artist.S, "No One You Know");
                // Dynamo seems to strip out the table name
                assert.isUndefined(getData.TableName);

                putParams.Item.SongTitle.S = "Call Me Today Changed";
                dynamodb.putItem(putParams, () => {
                    dynamodb.getItem(getParams, (getError2: any, getData2: any) => {
                        assert.equal(getData2.Item.SongTitle.S, "Call Me Today Changed");

                        mockDynamo.reset();
                        assert.equal(mockDynamo.records.length, 0);
                        done();
                    });
                });
            });
        });
    });

    it("Adds a record to mock dynamo, not changing environment variables", (done) => {
        process.env.AWS_REGION = "us-west-1";
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

        assert.equal(process.env.AWS_REGION, "us-west-1");
        dynamodb.putItem(putParams, (error: any, data: any) => {
            assert.isNull(error);
            assert.isDefined(data);

            dynamodb.getItem(getParams, (getError: any, getData: any) => {
                assert.isNull(error);
                assert.equal(getData.Item.Artist.S, "No One You Know");
                // Dynamo seems to strip out the table name
                assert.isUndefined(getData.TableName);

                getParams.Key.ID.S = "IDValueMissing";
                dynamodb.getItem(getParams, (getError2: any, getDataFails: any) => {
                    assert.isNull(error);
                    assert.isUndefined(getDataFails.Item);
                    done();
                });
            });
        });
    });

    it("create a table in mock dynamo, not changing environment variables", (done) => {
        process.env.AWS_REGION = "us-west-1";
        const mockDynamo = new db.DynamoDB();
        mockDynamo.mock();

        const dynamodb = new AWS.DynamoDB();
        var createParams = {
            AttributeDefinitions: [
                {
                    AttributeName: "Artist", 
                    AttributeType: "S"
                }, 
                {
                    AttributeName: "SongTitle", 
                    AttributeType: "S"
                }
            ], 
            KeySchema: [
                {
                    AttributeName: "Artist", 
                    KeyType: "HASH"
                }, 
                {
                    AttributeName: "SongTitle", 
                    KeyType: "RANGE"
                }
            ], 
            ProvisionedThroughput: {
                ReadCapacityUnits: 5, 
                WriteCapacityUnits: 5
            }, 
            TableName: "Music"
        };

        assert.equal(process.env.AWS_REGION, "us-west-1");
        dynamodb.createTable(createParams, (error: any, data: any) => {
            assert.isNull(error);
            assert.isDefined(data);
            assert.equal(data.TableDescription.TableStatus, "CREATING");
            done();
        });
    });
});
