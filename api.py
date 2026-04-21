"""
main.py — BEEHIVECTRL  (FastAPI backend)
Integra base de conocimiento, simulador y AG en el endpoint principal.
"""
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulador_colmena import SimuladorColmena
from controlador_ag     import ControladorAG
from base_conocimiento  import (
    RANGOS_BIOLOGICOS, TABLA_COSTOS, MODELO_TERMICO,
    diagnosticar_colmena, calcular_costo_intervencion
)

app = FastAPI(title="BEEHIVECTRL API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


class ParametrosIniciales(BaseModel):
    temp_inicial: float
    hum_inicial:  float


@app.get("/api/base-conocimiento")
def get_base_conocimiento():
    
    return {
        "rangos_biologicos": RANGOS_BIOLOGICOS,
        "modelo_termico":    MODELO_TERMICO,
        "tabla_costos":      TABLA_COSTOS,
    }


@app.post("/api/ejecutar-simulacion")
def ejecutar_simulacion(params: ParametrosIniciales):

    colmena_fisica = SimuladorColmena(
        temp_inicial=params.temp_inicial,
        hum_inicial=params.hum_inicial
    )
    cerebro_ag = ControladorAG(tam_poblacion=50, generaciones=20)

    data_simulacion        = []
    log_textual            = []
    historial_generaciones = []
    todos_los_mejores      = []

    pasos_simulacion   = 8
    pronostico_presion = [0.5, 0.8, 1.2, 1.5, 1.0, 0.4, -0.2, -0.5]

    for paso in range(pasos_simulacion):
        minuto = paso * 15

        diag_antes = colmena_fisica.diagnostico_actual()

        log_textual.append(
            f"[Minuto {minuto}] SENSOR → "
            f"Temp: {colmena_fisica.temp_actual:.2f}°C | "
            f"Hum: {colmena_fisica.hum_actual:.1f}%  "
            f"| Estado: {diag_antes['nivel_general']}"
        )

        mejor_accion, fitness, hist_mejor, hist_promedio = \
            cerebro_ag.obtener_mejor_accion(colmena_fisica)

        vent, agua, alimento, sombra = mejor_accion

        log_textual.append(
            f"   → DECISIÓN AG: Vent: {int(vent)}%, "
            f"Agua: {agua:.1f}ml, Jarabe: {alimento:.1f}g, "
            f"Sombra: {'Sí' if sombra else 'No'}"
        )

        desglose_costo = calcular_costo_intervencion(
            agua_ml=agua, jarabe_g=alimento,
            sombra=bool(sombra), vent_pct=vent,
            es_urgente=diag_antes["es_urgente"]
        )

        nueva_temp, nueva_hum, costo_total = colmena_fisica.aplicar_accion_real(
            vent, agua, alimento, sombra
        )

        diag_despues = colmena_fisica.diagnostico_actual()

        log_textual.append(
            f"   → RESULTADO: Temp → {nueva_temp:.2f}°C | "
            f"Hum → {nueva_hum:.1f}%  "
            f"| Estado post: {diag_despues['nivel_general']}\n"
        )

        data_simulacion.append({
            "minuto":         minuto,
            "temp":           round(nueva_temp,  2),
            "hum":            round(nueva_hum,   2),
            "vent":           int(vent),
            "agua":           round(agua,         1),
            "jarabe":         round(alimento,     1),
            "sombra":         bool(sombra),
            "fitness":        round(fitness,      4),
            "costo_MXN":      desglose_costo["costo_total_MXN"],
            "desglose_costo": desglose_costo,
            "diagnostico":    diag_despues,
        })

        todos_los_mejores.append({
            "fitness":         round(fitness, 4),
            "individuo":       mejor_accion,
            "temp_proyectada": round(nueva_temp, 2),
            "hum_proyectada":  round(nueva_hum,  2),
            "minuto":          minuto,
            "costo_MXN":       desglose_costo["costo_total_MXN"],
        })

        historial_generaciones.append({
            "minuto":        minuto,
            "hist_mejor":    [round(v, 4) for v in hist_mejor],
            "hist_promedio": [round(v, 4) for v in hist_promedio],
            "mejor_fitness": round(fitness, 4),
            "mejor_accion": {
                "vent":   int(vent),
                "agua":   round(agua,     1),
                "jarabe": round(alimento, 1),
                "sombra": bool(sombra),
            },
        })

        colmena_fisica.temp_actual += (
            pronostico_presion[paso] + random.uniform(-0.2, 0.3)
        )
        colmena_fisica.hum_actual -= random.uniform(0.5, 1.5)

    # ── TOP 3 
    todos_los_mejores.sort(key=lambda x: x["fitness"])
    top_3_raw = todos_los_mejores[:3]

    tabla_datos = []
    for i, entry in enumerate(top_3_raw):
        vent, agua, alimento, sombra = entry["individuo"]
        tabla_datos.append({
            "opcion":   f"#{i+1}",
            "temp":     entry["temp_proyectada"],
            "hum":      entry["hum_proyectada"],
            "vent":     int(vent),
            "agua":     round(agua,     1),
            "jarabe":   round(alimento, 1),
            "sombra":   bool(sombra),
            "fitness":  entry["fitness"],
            "costo_MXN":entry["costo_MXN"],
            "minuto":   entry["minuto"],
        })

    # ── Mejor intervención global 
    mejor = todos_los_mejores[0]
    vent_m, agua_m, alimento_m, sombra_m = mejor["individuo"]
    mejor_intervencion_global = {
        "minuto":   mejor["minuto"],
        "temp":     mejor["temp_proyectada"],
        "hum":      mejor["hum_proyectada"],
        "vent":     int(vent_m),
        "agua":     round(agua_m,     1),
        "jarabe":   round(alimento_m, 1),
        "sombra":   bool(sombra_m),
        "fitness":  mejor["fitness"],
        "costo_MXN":mejor["costo_MXN"],
    }

    # ── Resumen de la base de conocimiento usada 
    resumen_bc = {
        "temp_optima":   RANGOS_BIOLOGICOS["temp_optima_cria"],
        "rango_temp":    f"{RANGOS_BIOLOGICOS['temp_min_cria']}–{RANGOS_BIOLOGICOS['temp_max_cria']} °C",
        "rango_hum":     f"{RANGOS_BIOLOGICOS['hum_min_cria']}–{RANGOS_BIOLOGICOS['hum_max_cria']} %",
        "costo_agua":    f"${TABLA_COSTOS['costo_agua_por_ml']} MXN/ml",
        "costo_jarabe":  f"${TABLA_COSTOS['costo_jarabe_por_g']} MXN/g",
        "costo_sombra":  f"${TABLA_COSTOS['costo_sombra_por_uso']} MXN/uso",
        "salario_min":   f"${TABLA_COSTOS['costo_mano_obra_por_min']} MXN/min",
    }

    return {
        "status":                    "success",
        "tabla_top3":                tabla_datos,
        "data_simulacion":           data_simulacion,
        "historial_generaciones":    historial_generaciones,
        "mejor_intervencion_global": mejor_intervencion_global,
        "base_conocimiento_usada":   resumen_bc,
        "logs":                      log_textual,
    }