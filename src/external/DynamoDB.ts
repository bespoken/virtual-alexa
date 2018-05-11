const nock = require("nock");
const AWS = require("aws-sdk");
import {SkillContext} from "../core/SkillContext";

export class DynamoDB {
    /** @internal */
    private static putScope: any; // We keep the nock scope as a singleton - only one can be active at a time
    /** @internal */
    private static getScope: any; // We keep the nock scope as a singleton - only one can be active at a time

    private records: any[] = [];
    private region = "us-east-1";

    public mock() {
        this.setEnv();
        if (!nock.isActive()) {
            nock.activate();
        }

        this.mockPut();
        this.mockGet();
    }

    public reset() {
        this.records = [];
        if (DynamoDB.getScope) {
            DynamoDB.getScope.persist(false);
        }

        if (DynamoDB.putScope) {
            DynamoDB.putScope.persist(false);
        }
    }

    private setEnv() {
        if (process.env.AWS_REGION) {
            this.region = process.env.AWS_REGION;
        }
        this.setDefault("AWS_REGION", "us-east-1");
        this.setDefault("AWS_ACCESS_KEY_ID", "123456789");
        this.setDefault("AWS_SECRET_ACCESS_KEY", "123456789");
    }

    private setDefault(property: string, value: string) {
        process.env[property] = process.env[property] ? process.env[property] : value;
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
        DynamoDB.putScope = nock(this.baseURL())
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
        // Built this based on this info:
        //  https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html#API_PutItem_Examples
        DynamoDB.getScope = nock(this.baseURL())
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
        return "https://dynamodb." + this.region + ".amazonaws.com:443";
    }

    private simplifyRecord(dynamoObject: any) {
        return AWS.DynamoDB.Converter.unmarshall(dynamoObject);
    }
}
