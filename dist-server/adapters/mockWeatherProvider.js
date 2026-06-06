import { env } from "../env.js";
export async function mockWeather() {
    const hourly = ["Now", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"].map((time, index) => ({
        time,
        temperature: 17 - Math.floor(index / 3),
        precipitationChance: [12, 18, 26, 54, 71, 62, 38, 20][index],
        precipitationMm: [0, 0, 0.1, 0.7, 1.2, 0.8, 0.2, 0][index],
        condition: index >= 3 && index <= 5 ? "Rain" : "Cloudy"
    }));
    const daily = ["Today", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"].map((label, index) => ({
        date: new Date(Date.now() + index * 86_400_000).toISOString().slice(0, 10),
        label,
        high: [21, 20, 18, 19, 22, 21, 20, 18, 17, 19][index],
        low: [12, 11, 10, 11, 13, 12, 10, 9, 8, 10][index],
        precipitationChance: [54, 42, 20, 18, 12, 26, 48, 64, 38, 16][index],
        precipitationMm: [1.8, 0.7, 0, 0, 0, 0.2, 1.1, 2.4, 0.5, 0][index],
        condition: index === 0 ? "Showers later" : index === 7 ? "Rain" : "Cloudy"
    }));
    return {
        city: env.defaultCity,
        temperature: 17,
        condition: "Soft cloud",
        high: 21,
        low: 12,
        precipitationChance: 54,
        hourly,
        daily
    };
}
