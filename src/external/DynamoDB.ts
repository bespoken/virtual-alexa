const nock = require("nock");
const AWS = require("aws-sdk");
import {SkillContext} from "../core/SkillContext";

export class DynamoDB {
    /** @internal */
    private static putScope: any; // We keep the nock scope as a singleton - only one can be active at a time
    /** @internal */
    private static getScope: any; // We keep the nock scope as a singleton - only one can be active at a time

    private records: any[] = [];
    public mock() {
        if (!nock.isActive()) {
            nock.activate();
        }

        this.mockPut();
        this.mockGet();
    }

    public reset() {
        if (DynamoDB.getScope) {
            DynamoDB.getScope.persist(false);
        }

        if (DynamoDB.putScope) {
            DynamoDB.putScope.persist(false);
        }
    }

    private fetchImpl(table: string, key: any): any | undefined {
        for (const record of this.records) {
            if (record.TableName !== table) {
                continue;
            }

            const o = this.simplifyRecord(record.Item);
            // The key is an object, with potentially multiple fields
            // They each need to match
            let match = true;
            for (const keyPart of Object.keys(key)) {
                const keyPartValue = key[keyPart];
                if (o[keyPart] && o[keyPart] === keyPartValue) {
                    continue;
                }

                match = false;
                break;
            }

            if (match) {
                return record;
            }
        }
        return undefined;
    }

    private mockPut() {
        // const baseURL = new RegExp(".*dynamodb.*");
        // Built this based on this info:
        //  https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html#API_PutItem_Examples
        const baseURL = "https://dynamodb.us-east-1.amazonaws.com:443";
        DynamoDB.putScope = nock(baseURL)
            .matchHeader("x-amz-target", (value: string) => {
                return value.endsWith("PutItem");
            })
            .persist()
            .post("/", (body: any) => {
                this.records.push(body);
                return true;
            })
            .query(true)
            .reply(200, JSON.stringify({}));
    }

    private mockGet() {
        // const baseURL = new RegExp(".*dynamodb.*");
        // Built this based on this info:
        //  https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html#API_PutItem_Examples
        const baseURL = this.baseURL();
        DynamoDB.getScope = nock(baseURL)
            .matchHeader("x-amz-target", (value: string) => {
                return value.endsWith("GetItem");
            })
            .persist()
            .post("/", (body: any) => {
                return true;
            })
            .query(true)
            .reply(200, (uri: string, requestBody: any) => {
                const requestObject = JSON.parse(requestBody);
                const key = requestObject.Key;
                // Turn this into a regular javascript object - we use this for searching
                const keySimple = this.simplifyRecord(key);
                const record = this.fetchImpl(requestObject.TableName, keySimple);
                return record;
            });
    }

    private baseURL() {
        return "https://dynamodb.us-east-1.amazonaws.com:443";
    }

    private simplifyRecord(dynamoObject: any) {
        return AWS.DynamoDB.Converter.unmarshall(dynamoObject);
    }
}
