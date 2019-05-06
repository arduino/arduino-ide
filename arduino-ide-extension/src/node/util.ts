import * as grpc from "grpc";
import * as jspb from "google-protobuf";

export type GrpcMethod<Req, Resp> = (request: Req, callback: (error: grpc.ServiceError | null, response: Resp) => void) => grpc.ClientUnaryCall

export function promisify<M extends GrpcMethod<Req, Resp>, Req, Resp extends jspb.Message>(m: M, req: Req): Promise<Resp> {
    return new Promise<Resp>((resolve, reject) => {
        m(req, (err, resp) => {
            if (!!err) {
                reject(err);
            } else {
                resolve(resp);
            }
        });
    });
}