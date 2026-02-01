import { INestApplication } from "@nestjs/common";
import {
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerModule,
} from "@nestjs/swagger";

export function setupSwagger(
  app: INestApplication<any>,
  config: Omit<OpenAPIObject, "paths">,
  options?: SwaggerDocumentOptions & {
    secureAllPaths?: boolean;
  },
) {
  // Generate the document (This handles all scanning internally)
  const document = SwaggerModule.createDocument(app, config, {
    ...options,
    operationIdFactory: (controllerKey, methodKey, version) => {
      return `${controllerKey}_${methodKey}`;
    },
  });

  // Process tags and security
  if (options?.include) {
    const tags = new Set<string>();
    const legacyTags = new Set<string>();

    // Iterate over the generated paths to collect tags and apply logic
    for (const path of Object.keys(document.paths)) {
      for (const method of Object.keys(document.paths[path] as any)) {
        const operation = (document.paths[path] as any)[method];

        // Collect standard tags
        operation.tags?.forEach((tag: string) => {
          tags.add(String(tag));
        });

        // Apply Security
        if (options?.secureAllPaths && !operation.security) {
          operation.security = [{ bearer: [] }];
        }

        // Handle Legacy Tags
        if (operation["x-is-legacy"]) {
          operation.tags?.forEach((tag: string) => {
            legacyTags.add(tag);
          });
          operation.tags = operation.tags.map(
            (tag: string) => `${tag} (Legacy)`,
          );
        }
      }
    }

    const sortedLegacyTags = Array.from(legacyTags)
      .sort((a, b) => {
        const aIndex = Array.from(tags).indexOf(a);
        const bIndex = Array.from(tags).indexOf(b);

        return aIndex - bIndex;
      })
      .map((name) => `${name} (Legacy)`);

    return {
      document,
      // Return unique tags + legacy tags
      tags: Array.from(tags).concat(sortedLegacyTags),
    };
  }

  return {
    document,
  };
}
