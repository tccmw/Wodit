import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { SpotifyController } from "./spotify.controller";
import { SpotifyService } from "./spotify.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SpotifyController],
  providers: [SpotifyService],
  exports: [SpotifyService]
})
export class SpotifyModule {}
