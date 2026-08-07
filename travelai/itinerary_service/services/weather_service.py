# itinerary-service/services/weather_service.py

import httpx, os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from dotenv import load_dotenv
from shared_config import DESTINATION_COORDS
load_dotenv()

WEATHER_KEY = os.getenv("WEATHER_API_KEY")


async def get_weather_forecast(destination: str, no_of_days: int) -> list:
    coords = DESTINATION_COORDS.get(destination)
    if not coords:
        return get_default_weather(no_of_days)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "http://api.weatherapi.com/v1/forecast.json",
                params={
                    "key":  WEATHER_KEY,
                    "q":    f"{coords['lat']},{coords['lon']}",
                    "days": min(no_of_days, 14),
                    "aqi":  "no",
                },
                timeout=10.0,
            )
            if resp.status_code != 200:
                return get_default_weather(no_of_days)
            data  = resp.json()
            days  = data.get("forecast", {}).get("forecastday", [])
            result = []
            for day in days:
                d = day.get("day", {})
                result.append({
                    "date":        day.get("date"),
                    "max_temp":    d.get("maxtemp_c"),
                    "min_temp":    d.get("mintemp_c"),
                    "condition":   d.get("condition", {}).get("text", ""),
                    "icon":        d.get("condition", {}).get("icon", ""),
                    "humidity":    d.get("avghumidity"),
                    "wind_kph":    d.get("maxwind_kph"),
                    "rain_chance": d.get("daily_chance_of_rain", 0),
                    "uv_index":    d.get("uv", 0),
                })
            while len(result) < no_of_days:
                result.append(result[-1].copy() if result else get_default_weather(1)[0])
            return result[:no_of_days]
    except Exception as e:
        print(f"Weather error: {e}")
        return get_default_weather(no_of_days)


def get_default_weather(n: int) -> list:
    return [{"date": f"Day {i+1}", "max_temp": 28, "min_temp": 20,
             "condition": "Partly Cloudy", "icon": "", "humidity": 65,
             "wind_kph": 15, "rain_chance": 20, "uv_index": 5}
            for i in range(n)]