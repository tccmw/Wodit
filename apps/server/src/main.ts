import { NestFactory } from "@nestjs/core";
import { loadLocalEnv } from "./config/load-env";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  loadLocalEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
