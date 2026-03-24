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
    const variant = query.variant ? Number(query.variant) : 0;
    const sensitivity = query.sensitivity ? Number(query.sensitivity) : 0;
    const offset = query.offset ? Number(query.offset) : 0;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException("lat and lon query parameters are required.");
    }

    if (!Number.isFinite(sensitivity) || !Number.isFinite(offset) || !Number.isFinite(variant)) {
      throw new BadRequestException("sensitivity, offset, and variant must be numbers.");
    }

    return this.recommendationService.recommendByLocation({
      email: query.email,
      location: {
        lat,
        lng: lon
      },
      variant,
      preference: {
        sensitivity,
        offset,
        nickname: query.nickname || "Wodit User"
      }
    });
  }
}
