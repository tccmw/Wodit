import { Injectable } from "@nestjs/common";
import { buildRecommendation } from "@wodit/utils";
import type { RecommendationRequestDto } from "./recommendation.dto";

@Injectable()
export class RecommendationService {
  recommend({ weather, preference }: RecommendationRequestDto) {
    return buildRecommendation(weather, preference);
  }
}
