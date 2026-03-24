import type {
  FeedbackStatus,
  MusicMood,
  OutfitRecommendation,
  RecommendationResult,
  UserPreference,
  WeatherSnapshot
} from "@wodit/types";

export const demoWeatherPresets: WeatherSnapshot[] = [
  {
    label: "Rainy Commute",
    tempC: 9,
    feelsLikeC: 6,
    condition: "rain",
    precipitationMm: 4,
    windSpeedMs: 5.1,
    uvIndex: 1
  },
  {
    label: "Bright Noon",
    tempC: 22,
    feelsLikeC: 23,
    condition: "clear",
    precipitationMm: 0,
    windSpeedMs: 2.2,
    uvIndex: 8
  },
  {
    label: "Humid Evening",
    tempC: 27,
    feelsLikeC: 29,
    condition: "clouds",
    precipitationMm: 0.4,
    windSpeedMs: 1.6,
    uvIndex: 4
  }
];

export function calculateSubjectiveTemp(
  weather: WeatherSnapshot,
  preference: UserPreference
) {
  const base = weather.feelsLikeC ?? weather.tempC;
  const windPenalty = weather.windSpeedMs >= 6 ? -1.5 : weather.windSpeedMs >= 4 ? -0.8 : 0;
  const rainPenalty = weather.precipitationMm > 0 ? -0.6 : 0;

  return base - preference.sensitivity + preference.offset + windPenalty + rainPenalty;
}

export function buildRecommendation(
  weather: WeatherSnapshot,
  preference: UserPreference
): RecommendationResult {
  const subjectiveTemp = calculateSubjectiveTemp(weather, preference);
  const outfit = recommendOutfit(subjectiveTemp, weather);
  const musicMood = recommendMusicMood(subjectiveTemp, weather);

  return {
    subjectiveTemp,
    reason: describeRecommendation(subjectiveTemp, weather),
    outfit,
    musicMood
  };
}

export function recommendOutfit(
  subjectiveTemp: number,
  weather: WeatherSnapshot
): OutfitRecommendation {
  let outfit: OutfitRecommendation;

  if (subjectiveTemp <= 0) {
    outfit = {
      top: ["패딩", "목도리", "내의"],
      bottom: ["기모 바지", "부츠"],
      extras: ["핫팩"]
    };
  } else if (subjectiveTemp <= 10) {
    outfit = {
      top: ["코트", "자켓", "니트"],
      bottom: ["슬랙스", "운동화"],
      extras: []
    };
  } else if (subjectiveTemp <= 17) {
    outfit = {
      top: ["가디건", "얇은 자켓"],
      bottom: ["청바지", "면바지"],
      extras: []
    };
  } else if (subjectiveTemp <= 23) {
    outfit = {
      top: ["셔츠", "가벼운 니트"],
      bottom: ["면바지", "로퍼"],
      extras: []
    };
  } else {
    outfit = {
      top: ["반팔 티셔츠", "린넨 셔츠"],
      bottom: ["반바지", "샌들"],
      extras: []
    };
  }

  if (weather.precipitationMm > 0) {
    outfit.extras.push("우산", "방수 신발");
  }

  if (weather.uvIndex >= 7) {
    outfit.extras.push("선글라스", "모자");
  }

  return outfit;
}

export function recommendMusicMood(
  subjectiveTemp: number,
  weather: WeatherSnapshot
): MusicMood {
  if (weather.condition === "rain") {
    return {
      title: "Rain Glass",
      description: "비 오는 이동 시간에 맞는 다운템포, 로파이, 재즈 팝 무드입니다.",
      seedGenres: ["lofi", "jazz", "indie"]
    };
  }

  if (subjectiveTemp <= 10) {
    return {
      title: "Soft Layers",
      description: "코트와 니트에 어울리는 차분한 시티팝과 앰비언트 팝 계열입니다.",
      seedGenres: ["city-pop", "ambient", "soul"]
    };
  }

  if (subjectiveTemp >= 23) {
    return {
      title: "Sunlit Sprint",
      description: "가벼운 옷차림과 잘 맞는 청량한 팝, 펑크, 댄스 트랙 중심입니다.",
      seedGenres: ["dance", "funk", "pop"]
    };
  }

  return {
    title: "Easy Tempo",
    description: "셔츠와 가디건 사이 계절감을 살리는 인디 팝과 네오 소울 기반 무드입니다.",
    seedGenres: ["indie-pop", "neo-soul", "rnb"]
  };
}

export function applyFeedbackOffset(
  preference: UserPreference,
  status: FeedbackStatus
): UserPreference {
  const nextOffset =
    status === "TOO_COLD"
      ? preference.offset - 1
      : status === "TOO_HOT"
        ? preference.offset + 1
        : preference.offset;

  return {
    ...preference,
    offset: Math.max(-6, Math.min(6, nextOffset))
  };
}

export function createWeatherSummary(
  weather: WeatherSnapshot,
  subjectiveTemp: number,
  nickname: string
) {
  return `현재 온도는 ${weather.tempC}°C지만 ${nickname}의 맞춤 체감 온도는 ${subjectiveTemp.toFixed(
    1
  )}°C입니다. ${describeRecommendation(subjectiveTemp, weather)}`;
}

function describeRecommendation(subjectiveTemp: number, weather: WeatherSnapshot) {
  const thermalNote =
    subjectiveTemp <= 10
      ? "보온 중심 레이어링이 유리합니다."
      : subjectiveTemp >= 23
        ? "통기성 좋은 가벼운 조합이 적합합니다."
        : "실내외 온도차를 고려한 가벼운 레이어링이 적절합니다.";

  const weatherNote =
    weather.precipitationMm > 0
      ? "강수가 있어 우산과 방수 신발을 포함했습니다."
      : weather.uvIndex >= 7
        ? "자외선이 강해 모자와 선글라스를 추가했습니다."
        : "기본 데일리 조합으로 무리가 없습니다.";

  return `${thermalNote} ${weatherNote}`;
}
