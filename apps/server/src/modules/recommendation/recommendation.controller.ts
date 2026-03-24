import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  RecommendationQueryDto,
  RecommendationRequestDto
} from "./recommendation.dto";
import { RecommendationService } from "./recommendation.service";

@Controller("recommendations")
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  create(@Body() request: RecommendationRequestDto) {
    return this.recommendationService.recommend(request);
  }

  @Get("weather")
  async recommendByWeather(@Query() query: RecommendationQueryDto) {
    const lat = Number(query.lat);
    const lon = Number(query.lon);
    const sensitivity = query.sensitivity ? Number(query.sensitivity) : 0;
    const offset = query.offset ? Number(query.offset) : 0;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException("lat and lon query parameters are required.");
    }

    if (!Number.isFinite(sensitivity) || !Number.isFinite(offset)) {
      throw new BadRequestException("sensitivity and offset must be numbers.");
    }

    return this.recommendationService.recommendByLocation({
      location: {
        lat,
        lng: lon
      },
      preference: {
        sensitivity,
        offset,
        nickname: query.nickname || "Wodit User"
      }
    });
  }
}
