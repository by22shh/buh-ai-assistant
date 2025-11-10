declare module "docxtemplater" {
  export interface DocxtemplaterOptions {
    delimiters?: { start: string; end: string };
    parser?: (...args: any[]) => any;
    literalXmlDelimiter?: string;
  }

  export interface DocxtemplaterTag {
    tag: string;
    raw: string;
  }

  export default class Docxtemplater {
    constructor(zip: any, options?: DocxtemplaterOptions);
    loadZip(zip: any): void;
    compile(): void;
    getTags(): Record<string, unknown>;
    getFullTags(): DocxtemplaterTag[];
    getFullText(): string;
    setData(data: Record<string, unknown>): void;
    render(data?: Record<string, unknown>): void;
    getZip(): {
      generate(options: { type: "nodebuffer" }): Buffer;
    };
  }
}

declare module "pizzip" {
  export default class PizZip {
    constructor(data?: ArrayBuffer | Uint8Array | string, options?: Record<string, unknown>);
    file(name: string, data?: any, options?: Record<string, unknown>): any;
  }
}
