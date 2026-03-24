import { Module } from "@nestjs/common";
import { RecommendationModule } from "./recommendation/recommendation.module";
import { WeatherModule } from "./weather/weather.module";

@Module({
  imports: [WeatherModule, RecommendationModule]
})
export class AppModule {}
