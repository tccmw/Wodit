import { Module } from "@nestjs/common";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";
import { WeatherModule } from "../weather/weather.module";

@Module({
  imports: [WeatherModule],
  controllers: [RecommendationController],
  providers: [RecommendationService]
})
export class RecommendationModule {}
