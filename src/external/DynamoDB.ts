const nock = require("nock");
import {SkillContext} from "../core/SkillContext";

export class DynamoDB {
    /** @internal */
    private static putScope: any; // We keep the nock scope as a singleton - only one can be active at a time

    private data: any[] = [];
    public activate() {
        if (!nock.isActive()) {
            nock.activate();
        }

        this.mockPut();
    }

    public fetch(table: string, key: any): any | undefined {
        console.log("Data: " + this.data);
        for (const record of this.data) {
            if (record.TableName !== table) {
                continue;
            }
            // The key is an object, with potentially multiple fields
            // They each need to match
            let match = true;
            for (const keyPart of Object.keys(key)) {
                const keyPartValue = key[keyPart];
                const item = record.Item;
                if (item[keyPart] && item[keyPart].S === keyPartValue) {
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
        DynamoDB.putScope = nock(baseURL,  {
                filteringScope: (scope: any) => {
                    return true;
                },
            })
            .matchHeader("x-amz-target", (value: string) => {
                return value.endsWith("PutItem");
            })
            .persist()
            .post((uri: any) => {
                return true;
            }, (body: any) => {
                this.data.push(body);
                return true;
            })
            .query(true)
            .reply(200, JSON.stringify({}));
    }
}
