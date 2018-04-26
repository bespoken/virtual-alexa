import * as path from "path";

export class ModuleInvoker {
    public static invokeHandler(handler: string, event: any): Promise<any> {
        const handlerParts = handler.split(".");
        const functionName = handlerParts[handlerParts.length - 1];
        const fileName = handlerParts.slice(0, handlerParts.length - 1).join("/") + ".js";
        const fullPath = path.join(process.cwd(), fileName);
        const handlerModule = require(fullPath);

        return ModuleInvoker.invokeFunction(handlerModule[functionName], event);
    }

    public static invokeFunction(lambdaFunction: (...args: any[]) => any, event: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const callback = (error: Error, result: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            };

            const context = new LambdaContext(callback);
            const promise = lambdaFunction(event, context, callback);
            // For Node8, lambdas can return a promise - if they do, we call the context object with results
            if (promise) {
                promise.then((result: any) => {
                    context.done(null, result);
                }).catch((error: any) => {
                    context.done(error, null);
                });
            }
        });
    }
}

class LambdaContext {
    public awsRequestId = "N/A";
    public callbackWaitsForEmptyEventLoop = true;
    public functionName = "BST.LambdaServer";
    public functionVersion = "N/A";
    public memoryLimitInMB = -1;
    public invokedFunctionArn = "N/A";
    public logGroupName = "N/A";
    public logStreamName: string = null;
    public identity: any = null;
    public clientContext: any = null;

    public constructor(private callback: (error: Error, result: any) => void) {}

    public fail(error: Error) {
        this.done(error, null);
    }

    public succeed(body: any) {
        this.done(null, body);
    }

    public getRemainingTimeMillis() {
        return -1;
    }

    public done(error: Error, body: any) {
        let statusCode: number = 200;
        let contentType: string = "application/json";
        let bodyString: string = null;

        if (error === null) {
            bodyString = JSON.stringify(body);
        } else {
            statusCode = 500;
            contentType = "text/plain";
            bodyString = "Unhandled Exception from Lambda: " + error.toString();
        }

        this.callback(error, body);
    }
}
