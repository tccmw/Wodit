import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { OutfitModule } from "./outfit/outfit.module";
import { RecommendationModule } from "./recommendation/recommendation.module";
import { SpotifyModule } from "./spotify/spotify.module";
import { UsersModule } from "./users/users.module";
import { WeatherModule } from "./weather/weather.module";

@Module({
  imports: [DatabaseModule, OutfitModule, WeatherModule, UsersModule, SpotifyModule, RecommendationModule]
})
export class AppModule {}
