import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { WeatherService } from "./weather.service";

@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get("preview")
  preview(@Query("preset") preset?: string) {
    return this.weatherService.getPreviewWeather(preset);
  }

  @Get("geocode")
  async geocode(@Query("q") query?: string) {
    if (!query?.trim()) {
      throw new BadRequestException("q query parameter is required.");
    }

    return this.weatherService.geocodeAddress(query);
  }

  @Get()
  async byCoordinates(@Query("lat") lat?: string, @Query("lon") lon?: string) {
    const latitude = Number(lat);
    const longitude = Number(lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException("lat and lon query parameters are required.");
    }

    return this.weatherService.getWeatherByCoordinates({
      lat: latitude,
      lng: longitude
    });
  }
}
