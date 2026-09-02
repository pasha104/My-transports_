from __future__ import annotations

import math
import os
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="BUSPHOTO Python Engine", version="1.0.0")

# GitHub Pages is a static site, so the Python API is intentionally a separate
# service. In production, restrict this list to the exact GitHub Pages origin.
allowed_origins = [
    x.strip()
    for x in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if x.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Point(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class RouteRequest(BaseModel):
    points: List[Point] = Field(..., min_length=2)
    average_speed_kmh: float = Field(40, gt=1, le=160)
    stop_count: int = Field(0, ge=0, le=1000)
    stop_seconds: int = Field(20, ge=0, le=600)
    terminal_stop_seconds: int = Field(300, ge=0, le=3600)


class TripRequest(BaseModel):
    distance_km: float = Field(..., ge=0)
    average_speed_kmh: float = Field(40, gt=1, le=160)
    stop_count: int = Field(0, ge=0, le=1000)
    stop_seconds: int = Field(20, ge=0, le=600)
    capacity: int = Field(1, ge=1, le=1000)
    occupancy_percent: float = Field(70, ge=0, le=100)
    fare_per_passenger: float = Field(10, ge=0)


class SalaryRequest(BaseModel):
    base_salary: float = Field(..., ge=0)
    trips: int = Field(0, ge=0, le=10000)
    trip_bonus: float = Field(0, ge=0)
    reliability_percent: float = Field(100, ge=0, le=100)


def haversine_km(a: Point, b: Point) -> float:
    radius = 6371.0088
    lat1, lat2 = math.radians(a.lat), math.radians(b.lat)
    dlat = lat2 - lat1
    dlon = math.radians(b.lon - a.lon)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(min(1, h)))


def round_money(value: float) -> float:
    return round(value, 2)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "busphoto-python", "version": app.version}


@app.get("/api/time")
def server_time() -> dict:
    return {"utc": datetime.now(timezone.utc).isoformat()}


@app.post("/api/route/calculate")
def calculate_route(data: RouteRequest) -> dict:
    distance = sum(haversine_km(data.points[i - 1], data.points[i]) for i in range(1, len(data.points)))
    moving_minutes = distance / data.average_speed_kmh * 60
    stop_minutes = data.stop_count * data.stop_seconds / 60
    terminal_minutes = data.terminal_stop_seconds / 60
    total_minutes = moving_minutes + stop_minutes + terminal_minutes
    return {
        "distance_km": round(distance, 3),
        "moving_minutes": round(moving_minutes, 1),
        "stop_minutes": round(stop_minutes, 1),
        "terminal_minutes": round(terminal_minutes, 1),
        "total_minutes": round(total_minutes, 1),
        "total_hours": round(total_minutes / 60, 2),
    }


@app.post("/api/trip/calculate")
def calculate_trip(data: TripRequest) -> dict:
    moving_minutes = data.distance_km / data.average_speed_kmh * 60
    stop_minutes = data.stop_count * data.stop_seconds / 60
    total_minutes = moving_minutes + stop_minutes
    passengers = round(data.capacity * data.occupancy_percent / 100)
    payout = passengers * data.fare_per_passenger
    return {
        "distance_km": round(data.distance_km, 3),
        "duration_minutes": round(total_minutes, 1),
        "passengers": passengers,
        "payout": round_money(payout),
    }


@app.post("/api/salary/calculate")
def calculate_salary(data: SalaryRequest) -> dict:
    reliability_factor = data.reliability_percent / 100
    bonus = data.trips * data.trip_bonus
    total = (data.base_salary + bonus) * reliability_factor
    return {
        "base_salary": round_money(data.base_salary),
        "trip_bonus": round_money(bonus),
        "reliability_factor": round(reliability_factor, 3),
        "total": round_money(total),
    }
