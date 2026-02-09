import { setupSwagger } from "@libs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AuthModule } from "./auth/auth.module";
import { PostsModule } from "./posts/posts.module";
import { PrismaExceptionFilter } from "./prisma/prisma-exception.filter";
import { SampleModule } from "./sample/sample.module";

export function swaggerCustomScript(endpoint: string, tagOrder?: string[]) {
  return [
    bootstrap.toString(),
    `bootstrap("${endpoint}", ${JSON.stringify(tagOrder)})`,
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: configService.get("CLIENT_URL")?.split(","),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.use(cookieParser());

  const apiEndpoint = configService.get("SERVER_URL");
  const config = new DocumentBuilder()
    .addServer(apiEndpoint)
    .setTitle("AniHub v1 API Docs")
    .setVersion("1.0")
    .build();

  const { document, tags } = setupSwagger(app, config, {
    include: [SampleModule, AuthModule, PostsModule],
  });

  SwaggerModule.setup("/docs", app, document, {
    customSiteTitle: "Pingpong v1 API Docs",
    jsonDocumentUrl: "docs-json",
    yamlDocumentUrl: "docs-yaml",
    customJsStr: swaggerCustomScript(apiEndpoint, tags),
    useGlobalPrefix: true,
  });

  const nodeEnv = configService.get("NODE_ENV");

  if (nodeEnv === "production") {
    app.enableShutdownHooks();
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
