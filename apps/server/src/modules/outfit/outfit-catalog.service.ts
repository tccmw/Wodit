import { Injectable, OnModuleInit } from "@nestjs/common";
import { OutfitCategory, type OutfitItem, ThermalBand } from "@prisma/client";
import type { OutfitRecommendation, WeatherSnapshot } from "@wodit/types";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class OutfitCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.outfitItem.count();
    if (count > 0) return;

    await this.prisma.outfitItem.createMany({
      data: seedItems
    });
  }

  async buildOutfit(
    subjectiveTemp: number,
    weather: WeatherSnapshot,
    variant: number
  ): Promise<{ outfit: OutfitRecommendation; headline: string }> {
    const thermalBand = getThermalBand(subjectiveTemp);
    const items = await this.prisma.outfitItem.findMany({
      where: {
        thermalBand
      },
      orderBy: [{ weight: "desc" }, { name: "asc" }]
    });

    const topPool = items.filter((item: OutfitItem) => item.category === OutfitCategory.TOP);
    const bottomPool = items.filter(
      (item: OutfitItem) => item.category === OutfitCategory.BOTTOM
    );
    const extraPool = items.filter(
      (item: OutfitItem) =>
        item.category === OutfitCategory.EXTRA &&
        (!item.rainOnly || weather.precipitationMm > 0) &&
        (!item.uvOnly || weather.uvIndex >= 7)
    );

    const top = pickFromPool(topPool, 2, variant + 3);
    const bottom = pickFromPool(bottomPool, 2, variant + 19);
    const extras = pickFromPool(extraPool, Math.min(3, extraPool.length), variant + 41);

    if (weather.precipitationMm > 0) {
      extras.push(...pickRequired(extraPool, ["우산", "방수 슈즈"]));
    }

    if (weather.uvIndex >= 7) {
      extras.push(...pickRequired(extraPool, ["선글라스", "캡 모자"]));
    }

    const uniqueExtras = dedupe(extras);
    const headline = createHeadline(weather, thermalBand, top, uniqueExtras);

    return {
      outfit: {
        top,
        bottom,
        extras: uniqueExtras
      },
      headline
    };
  }
}

function pickFromPool(
  pool: Array<{ name: string }>,
  count: number,
  variant: number
) {
  const source = [...pool];
  const picked: string[] = [];

  for (let index = 0; index < count && source.length > 0; index += 1) {
    const nextIndex = Math.abs(variant * 13 + index * 7) % source.length;
    picked.push(source.splice(nextIndex, 1)[0].name);
  }

  return picked;
}

function pickRequired(
  pool: Array<{ name: string }>,
  names: string[]
) {
  return pool.filter((item) => names.includes(item.name)).map((item) => item.name);
}

function dedupe(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function createHeadline(
  weather: WeatherSnapshot,
  thermalBand: ThermalBand,
  top: string[],
  extras: string[]
) {
  if (weather.precipitationMm > 0) {
    return `${top[0] ?? "레이어드"} 중심의 비 오는 날 방수 코디`;
  }

  if (weather.uvIndex >= 7) {
    return `${top[0] ?? "가벼운 상의"}에 자외선 대비를 더한 산뜻한 룩`;
  }

  if (thermalBand === ThermalBand.FREEZING || thermalBand === ThermalBand.COLD) {
    return `${top[0] ?? "아우터"}로 보온을 챙긴 차분한 데일리 코디`;
  }

  if (thermalBand === ThermalBand.WARM) {
    return `${top[0] ?? "반팔"} 위주로 가볍게 맞춘 시원한 코디`;
  }

  if (extras.length > 0) {
    return `${top[0] ?? "레이어드"}에 포인트 아이템을 더한 오늘의 코디`;
  }

  return `${top[0] ?? "기본 상의"} 중심의 밸런스 좋은 데일리 코디`;
}

function getThermalBand(subjectiveTemp: number): ThermalBand {
  if (subjectiveTemp <= 0) return ThermalBand.FREEZING;
  if (subjectiveTemp <= 10) return ThermalBand.COLD;
  if (subjectiveTemp <= 17) return ThermalBand.COOL;
  if (subjectiveTemp <= 23) return ThermalBand.MILD;
  return ThermalBand.WARM;
}

const seedItems: Array<{
  name: string;
  category: OutfitCategory;
  thermalBand: ThermalBand;
  weight?: number;
  rainOnly?: boolean;
  uvOnly?: boolean;
  styleTag?: string;
}> = [
  { name: "패딩", category: OutfitCategory.TOP, thermalBand: ThermalBand.FREEZING, styleTag: "warm" },
  { name: "롱패딩", category: OutfitCategory.TOP, thermalBand: ThermalBand.FREEZING, styleTag: "urban" },
  { name: "플리스", category: OutfitCategory.TOP, thermalBand: ThermalBand.FREEZING, styleTag: "casual" },
  { name: "기모 팬츠", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.FREEZING, styleTag: "warm" },
  { name: "울 팬츠", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.FREEZING, styleTag: "clean" },
  { name: "부츠", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.FREEZING, styleTag: "heavy" },
  { name: "목도리", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.FREEZING, styleTag: "warm" },
  { name: "핫팩", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.FREEZING, styleTag: "warm" },

  { name: "코트", category: OutfitCategory.TOP, thermalBand: ThermalBand.COLD, styleTag: "city" },
  { name: "재킷", category: OutfitCategory.TOP, thermalBand: ThermalBand.COLD, styleTag: "classic" },
  { name: "니트", category: OutfitCategory.TOP, thermalBand: ThermalBand.COLD, styleTag: "soft" },
  { name: "슬랙스", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COLD, styleTag: "city" },
  { name: "청바지", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COLD, styleTag: "casual" },
  { name: "운동화", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COLD, styleTag: "daily" },
  { name: "레더 슈즈", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COLD, styleTag: "formal" },
  { name: "가죽 장갑", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COLD, styleTag: "classic" },

  { name: "가디건", category: OutfitCategory.TOP, thermalBand: ThermalBand.COOL, styleTag: "soft" },
  { name: "얇은 재킷", category: OutfitCategory.TOP, thermalBand: ThermalBand.COOL, styleTag: "layered" },
  { name: "맨투맨", category: OutfitCategory.TOP, thermalBand: ThermalBand.COOL, styleTag: "casual" },
  { name: "면바지", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COOL, styleTag: "clean" },
  { name: "크림진", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COOL, styleTag: "bright" },
  { name: "스니커즈", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.COOL, styleTag: "daily" },
  { name: "볼캡", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COOL, styleTag: "casual" },

  { name: "셔츠", category: OutfitCategory.TOP, thermalBand: ThermalBand.MILD, styleTag: "clean" },
  { name: "린넨 셔츠", category: OutfitCategory.TOP, thermalBand: ThermalBand.MILD, styleTag: "light" },
  { name: "반팔 니트", category: OutfitCategory.TOP, thermalBand: ThermalBand.MILD, styleTag: "smart" },
  { name: "로퍼", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.MILD, styleTag: "smart" },
  { name: "슬립온", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.MILD, styleTag: "easy" },
  { name: "가벼운 가방", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.MILD, styleTag: "daily" },
  { name: "선글라스", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.MILD, uvOnly: true, styleTag: "sun" },
  { name: "캡 모자", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.MILD, uvOnly: true, styleTag: "sun" },

  { name: "반팔 티셔츠", category: OutfitCategory.TOP, thermalBand: ThermalBand.WARM, styleTag: "cool" },
  { name: "피케 티셔츠", category: OutfitCategory.TOP, thermalBand: ThermalBand.WARM, styleTag: "smart" },
  { name: "린넨 탑", category: OutfitCategory.TOP, thermalBand: ThermalBand.WARM, styleTag: "light" },
  { name: "반바지", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.WARM, styleTag: "cool" },
  { name: "린넨 팬츠", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.WARM, styleTag: "breezy" },
  { name: "샌들", category: OutfitCategory.BOTTOM, thermalBand: ThermalBand.WARM, styleTag: "summer" },
  { name: "텀블러", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.WARM, styleTag: "summer" },

  { name: "우산", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COLD, rainOnly: true, weight: 3, styleTag: "rain" },
  { name: "방수 슈즈", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COLD, rainOnly: true, weight: 3, styleTag: "rain" },
  { name: "바람막이", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COOL, rainOnly: true, styleTag: "rain" },
  { name: "우산", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COOL, rainOnly: true, weight: 3, styleTag: "rain" },
  { name: "방수 슈즈", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.COOL, rainOnly: true, weight: 3, styleTag: "rain" },
  { name: "우산", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.MILD, rainOnly: true, weight: 3, styleTag: "rain" },
  { name: "방수 슈즈", category: OutfitCategory.EXTRA, thermalBand: ThermalBand.MILD, rainOnly: true, weight: 3, styleTag: "rain" }
];
