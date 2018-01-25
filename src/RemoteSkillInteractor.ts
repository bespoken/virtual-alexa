import * as http from "http";
import * as https from "https";
import * as URL from "url";
import {InteractionModel} from "./InteractionModel";
import {SkillInteractor} from "./SkillInteractor";

export class RemoteSkillInteractor extends SkillInteractor {
    public constructor(private urlString: string,
                       protected model: InteractionModel,
                       locale: string,
                       applicationID?: string) {
        super(model, locale, applicationID);
    }

    protected invoke(requestJSON: any): Promise<any> {
        const httpModule: any = this.urlString.startsWith("https") ? https : http;
        const url = URL.parse(this.urlString);
        const requestString = JSON.stringify(requestJSON);

        const requestOptions = {
            headers: {
                "Content-Length": Buffer.byteLength(requestString),
                "Content-Type": "application/json",
            },
            hostname: url.hostname,
            method: "POST",
            path: url.path,
            port: url.port ? parseInt(url.port, 10) : undefined,
        };

        return new Promise((resolve, reject) => {
            const req = httpModule.request(requestOptions, (response: any) => {
                if (response.statusCode !== 200) {
                    reject("Invalid response: " + response.statusCode + " Message: " + response.statusMessage);
                    return;
                }

                let responseString = "";
                response.setEncoding("utf8");
                response.on("data", (chunk: string) => {
                    responseString = responseString + chunk;
                });

                response.on("end", () => {
                    try {
                        const responseJSON = JSON.parse(responseString);
                        resolve(responseJSON);
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on("error", (e: Error) => {
                console.error(`problem with request: ${e.message}`);
                reject(e);
            });

            req.write(requestString);
            req.end();
        });
    }

}
