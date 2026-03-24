"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoWeatherPresets = void 0;
exports.calculateSubjectiveTemp = calculateSubjectiveTemp;
exports.buildRecommendation = buildRecommendation;
exports.recommendOutfit = recommendOutfit;
exports.recommendMusicMood = recommendMusicMood;
exports.applyFeedbackOffset = applyFeedbackOffset;
exports.createWeatherSummary = createWeatherSummary;
exports.formatCoordinates = formatCoordinates;
exports.demoWeatherPresets = [
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
function calculateSubjectiveTemp(weather, preference) {
    const base = weather.feelsLikeC ?? weather.tempC;
    const windPenalty = weather.windSpeedMs >= 6 ? -1.5 : weather.windSpeedMs >= 4 ? -0.8 : 0;
    const rainPenalty = weather.precipitationMm > 0 ? -0.6 : 0;
    return base - preference.sensitivity + preference.offset + windPenalty + rainPenalty;
}
function buildRecommendation(weather, preference) {
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
function recommendOutfit(subjectiveTemp, weather) {
    let outfit;
    if (subjectiveTemp <= 0) {
        outfit = {
            top: ["\uD328\uB529", "\uBAA9\uB3C4\uB9AC", "\uB0B4\uC758"],
            bottom: ["\uAE30\uBAA8 \uD32C\uCE20", "\uBD80\uCE20"],
            extras: ["\uD56B\uD329"]
        };
    }
    else if (subjectiveTemp <= 10) {
        outfit = {
            top: ["\uCF54\uD2B8", "\uC7AC\uD0B7", "\uB2C8\uD2B8"],
            bottom: ["\uC2AC\uB799\uC2A4", "\uC6B4\uB3D9\uD654"],
            extras: []
        };
    }
    else if (subjectiveTemp <= 17) {
        outfit = {
            top: ["\uAC00\uB514\uAC74", "\uC587\uC740 \uC7AC\uD0B7"],
            bottom: ["\uCCAD\uBC14\uC9C0", "\uBA74\uBC14\uC9C0"],
            extras: []
        };
    }
    else if (subjectiveTemp <= 23) {
        outfit = {
            top: ["\uC154\uCE20", "\uAC00\uBCBC\uC6B4 \uB2C8\uD2B8"],
            bottom: ["\uBA74\uBC14\uC9C0", "\uB85C\uD37C"],
            extras: []
        };
    }
    else {
        outfit = {
            top: ["\uBC18\uD314 \uD2F0\uC154\uCE20", "\uB9B0\uB128 \uC154\uCE20"],
            bottom: ["\uBC18\uBC14\uC9C0", "\uC0CC\uB4E4"],
            extras: []
        };
    }
    if (weather.precipitationMm > 0) {
        outfit.extras.push("\uC6B0\uC0B0", "\uBC29\uC218 \uC288\uC988");
    }
    if (weather.uvIndex >= 7) {
        outfit.extras.push("\uC120\uAE00\uB77C\uC2A4", "\uCEA1 \uBAA8\uC790");
    }
    return outfit;
}
function recommendMusicMood(subjectiveTemp, weather) {
    if (weather.condition === "rain") {
        return {
            title: "Rain Glass",
            description: "\uBE44 \uC624\uB294 \uCD9C\uADFC\uAE38\uC5D0 \uC5B4\uC6B8\uB9AC\uB294 \uB85C\uD30C\uC774 \uC7AC\uC988\uC640 \uC794\uC794\uD55C \uC778\uB514 \uC0AC\uC6B4\uB4DC.",
            seedGenres: ["lofi", "jazz", "indie"]
        };
    }
    if (subjectiveTemp <= 10) {
        return {
            title: "Soft Layers",
            description: "\uCF54\uD2B8\uC640 \uB2C8\uD2B8 \uBB34\uB4DC\uC5D0 \uB9DE\uB294 \uC2DC\uD2F0\uD31D, \uC570\uBE44\uC5B8\uD2B8, \uC18C\uC6B8 \uD50C\uB808\uC774\uB9AC\uC2A4\uD2B8.",
            seedGenres: ["city-pop", "ambient", "soul"]
        };
    }
    if (subjectiveTemp >= 23) {
        return {
            title: "Sunlit Sprint",
            description: "\uAC00\uBCBC\uC6B4 \uC637\uCC28\uB9BC\uC5D0 \uC5B4\uC6B8\uB9AC\uB294 \uBC1D\uC740 \uD31D, \uD391\uD06C, \uB304\uC2A4 \uD2B8\uB799.",
            seedGenres: ["dance", "funk", "pop"]
        };
    }
    return {
        title: "Easy Tempo",
        description: "\uC560\uB9E4\uD55C \uAC04\uC808\uAE30\uC5D0 \uC798 \uC5B4\uC6B8\uB9AC\uB294 \uC778\uB514\uD31D\uACFC \uB124\uC624\uC18C\uC6B8, \uBD80\uB4DC\uB7EC\uC6B4 R&B.",
        seedGenres: ["indie-pop", "neo-soul", "rnb"]
    };
}
function applyFeedbackOffset(preference, status) {
    const nextOffset = status === "TOO_COLD"
        ? preference.offset - 1
        : status === "TOO_HOT"
            ? preference.offset + 1
            : preference.offset;
    return {
        ...preference,
        offset: Math.max(-6, Math.min(6, nextOffset))
    };
}
function createWeatherSummary(weather, subjectiveTemp, nickname) {
    return `\uD604\uC7AC \uAE30\uC628\uC740 ${weather.tempC}\u00B0C\uC9C0\uB9CC ${nickname}\uB2D8\uC758 \uB9DE\uCDA4 \uCCB4\uAC10 \uC628\uB3C4\uB294 ${subjectiveTemp.toFixed(1)}\u00B0C\uC785\uB2C8\uB2E4. ${describeRecommendation(subjectiveTemp, weather)}`;
}
function describeRecommendation(subjectiveTemp, weather) {
    const thermalNote = subjectiveTemp <= 10
        ? "\uBCF4\uC628 \uC704\uC8FC\uC758 \uB808\uC774\uC5B4\uB4DC \uC870\uD569\uC774 \uB354 \uC548\uC815\uC801\uC785\uB2C8\uB2E4."
        : subjectiveTemp >= 23
            ? "\uD1B5\uAE30\uC131\uC774 \uC88B\uC740 \uAC00\uBCBC\uC6B4 \uC637\uCC28\uB9BC\uC774 \uB354 \uC801\uD569\uD569\uB2C8\uB2E4."
            : "\uC2E4\uB0B4\uC678 \uC628\uB3C4 \uCC28\uB97C \uACE0\uB824\uD55C \uAC00\uBCBC\uC6B4 \uB808\uC774\uC5B4\uB4DC \uC870\uD569\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
    const weatherNote = weather.precipitationMm > 0
        ? "\uAC15\uC218\uAC00 \uC788\uC5B4 \uC6B0\uC0B0\uACFC \uBC29\uC218 \uC544\uC774\uD15C\uC744 \uD568\uAED8 \uCD94\uCC9C\uD588\uC2B5\uB2C8\uB2E4."
        : weather.uvIndex >= 7
            ? "\uC790\uC678\uC120 \uC9C0\uC218\uAC00 \uB192\uC544 \uC120\uAE00\uB77C\uC2A4\uC640 \uBAA8\uC790\uB97C \uD568\uAED8 \uCD94\uCC9C\uD588\uC2B5\uB2C8\uB2E4."
            : "\uCD94\uAC00 \uC7A5\uBE44 \uC5C6\uC774\uB3C4 \uBB34\uB09C\uD55C \uC77C\uC0C1 \uCF54\uB514\uC785\uB2C8\uB2E4.";
    return `${thermalNote} ${weatherNote}`;
}
function formatCoordinates(location) {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}
