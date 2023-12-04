import { TarReader } from "tarballjs";
import { inflate } from "pako";
import { fetch, ResponseType } from "@tauri-apps/api/http";

export type WorkerEvent =
    | {
          type: "done";
          file: Uint8Array;
      }
    | {
          type: "error";
          message: string;
      };

async function download(tgzData: Uint8Array) {
    try {
        console.log("Inflating", tgzData);
        const tarball = inflate(tgzData);
        console.log("Untarring", tarball);
        const untar = new TarReader();
        const files = untar.readArrayBuffer(tarball.buffer);
        const firstFile = files[0];
        if (!firstFile) {
            throw new Error("No files in tarball");
        }
        const file = untar.getFileBinary(firstFile.name)!;
        console.log("Done", firstFile);

        postMessage({ type: "done", file } satisfies WorkerEvent, {
            transfer: [file.buffer],
        });
    } catch (error) {
        console.error(error);
        postMessage({
            type: "error",
            message: String(error),
        } satisfies WorkerEvent);
    }
}

addEventListener("message", (event) => {
    download(event.data);
});
