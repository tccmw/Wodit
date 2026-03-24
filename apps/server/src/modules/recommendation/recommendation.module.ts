import { Module } from "@nestjs/common";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";
import { OutfitModule } from "../outfit/outfit.module";
import { WeatherModule } from "../weather/weather.module";
import { UsersModule } from "../users/users.module";
import { SpotifyModule } from "../spotify/spotify.module";

@Module({
  imports: [WeatherModule, UsersModule, SpotifyModule, OutfitModule],
  controllers: [RecommendationController],
  providers: [RecommendationService]
})
export class RecommendationModule {}
