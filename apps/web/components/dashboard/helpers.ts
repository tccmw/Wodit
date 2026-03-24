import type { WeatherCondition, WeatherRecommendationResponse } from "@wodit/types";

export const apiBase = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export function getConditionLabel(condition?: WeatherCondition) {
  switch (condition) {
    case "clear":
      return "\uB9D1\uC74C";
    case "clouds":
      return "\uAD6C\uB984";
    case "rain":
      return "\uBE44";
    case "snow":
      return "\uB208";
    case "mist":
      return "\uC548\uAC1C";
    default:
      return "-";
  }
}

export function getThemeMode(condition?: WeatherCondition) {
  if (condition === "rain") return "Rain Mode";
  if (condition === "snow") return "Snow Mode";
  if (condition === "clear") return "Clear Mode";
  return "Daily Mode";
}

export function buildLookbookItems(data: WeatherRecommendationResponse | null) {
  if (!data) {
    return ["\uCF54\uD2B8", "\uC2AC\uB799\uC2A4", "\uBC29\uC218 \uC288\uC988"];
  }

  return [
    ...data.recommendation.outfit.top,
    ...data.recommendation.outfit.bottom,
    ...data.recommendation.outfit.extras
  ].filter((item, index, list) => list.indexOf(item) === index);
}
