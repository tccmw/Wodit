import { Body, Controller, Post } from "@nestjs/common";
import { RecommendationRequestDto } from "./recommendation.dto";
import { RecommendationService } from "./recommendation.service";

@Controller("recommendations")
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  create(@Body() request: RecommendationRequestDto) {
    return this.recommendationService.recommend(request);
  }
}
