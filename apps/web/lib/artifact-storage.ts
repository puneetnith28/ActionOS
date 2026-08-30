interface ArtifactBucket {
  file(path: string): {
    save(data: Buffer, options: object): Promise<unknown>;
    download(): Promise<[Buffer]>;
    delete(options: { ignoreNotFound: boolean }): Promise<unknown>;
  };
}

export interface StoredAnalysisArtifact {
  path: string;
  contentType: "text/plain" | "image/jpeg" | "image/png" | "application/pdf";
  bytes: Uint8Array;
}

export class PrivateArtifactStorage {
  constructor(private readonly bucket: ArtifactBucket) {}

  async save(input: StoredAnalysisArtifact): Promise<void> {
    await this.bucket.file(input.path).save(Buffer.from(input.bytes), {
      resumable: false,
      validation: "crc32c",
      metadata: {
        contentType: input.contentType,
        cacheControl: "private, no-store, max-age=0"
      }
    });
  }

  async read(path: string): Promise<Uint8Array> {
    const [bytes] = await this.bucket.file(path).download();
    return new Uint8Array(bytes);
  }

  async delete(path: string): Promise<void> {
    await this.bucket.file(path).delete({ ignoreNotFound: true });
  }
}
