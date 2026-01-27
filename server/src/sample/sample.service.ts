import { Injectable } from "@nestjs/common";

@Injectable()
export class SampleService {
    getText(name: string): string {
        return `Hello ${name}`;
    }
}
