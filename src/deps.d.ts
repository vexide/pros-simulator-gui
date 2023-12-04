declare module "tarballjs" {
    export class TarReader {
        fileInfo: FileInfo[];
        buffer?: ArrayBuffer;
        readFile(file: File | Blob): Promise<FileInfo[]>;
        readArrayBuffer(buffer: ArrayBuffer): FileInfo[];
        getFileInfo(): FileInfo[];
        getTextFile(file_name: string): string | undefined;
        getFileBlob(file_name: string, mimetype?: string): Blob | undefined;
        getFileBinary(file_name: string): Uint8Array | undefined;
    }

    export interface FileInfo {
        name: string;
        /** file / directory / char code */
        type: string;
        size: number;
        header_offset: number;
    }

    export class TarWriter {
        addTextFile(name: string, text: string, opts?: Opts): void;
        addFileArrayBuffer(
            name: string,
            arrayBuffer: ArrayBuffer,
            opts?: Opts,
        ): void;
        addFile(name: string, file: File | Blob, opts?: Opts): void;
        addFolder(name: string, opts?: Opts): void;
        async download(filename: string): Promise<void>;
        async writeBlob(onUpdate?: (progress: number) => void): Promise<Blob>;
        write(onUpdate?: (progress: number) => void): Promise<Uint8Array>;
    }

    export interface Opts {
        uid?: number;
        gid?: number;
        mode?: string;
        mtime?: number;
        user?: string;
        group?: string;
    }
}
