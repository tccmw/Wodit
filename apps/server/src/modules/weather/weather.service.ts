import { Injectable } from "@nestjs/common";
import { demoWeatherPresets } from "@wodit/utils";

@Injectable()
export class WeatherService {
  getPreviewWeather(preset?: string) {
    const selected = demoWeatherPresets.find(
      (item) => item.label.toLowerCase() === preset?.toLowerCase()
    );

    return selected ?? demoWeatherPresets[0];
  }
}
