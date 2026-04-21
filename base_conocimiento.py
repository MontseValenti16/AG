"""
=============================================================================
BASE DE CONOCIMIENTO — BEEHIVECTRL
=============================================================================
Fuentes científicas:
  - Rangos biológicos: Abou-Shaara et al. (2017); Winston (1987);
    Doull (1976); Human et al. (2006); Kronenberg & Heller (1982)
  - Modelo termodinámico empírico: Mitchell (2019); Fahrenholz et al. (1989)
  - Costos apícolas México: Magaña & Leyva (2011); Contreras & Magaña (2017);
    SAGARPA/Cofemersimir (2018); Corriente Alterna UNAM (2025)
=============================================================================
"""

# ─────────────────────────────────────────────────────────────────────────────
# 1. RANGOS BIOLÓGICOS — Apis mellifera
#    Fuente: literatura científica apícola consolidada
# ─────────────────────────────────────────────────────────────────────────────
RANGOS_BIOLOGICOS = {

    # ── Temperatura ──────────────────────────────────────────────────────────
    "temp_optima_cria":      35.0,   # °C — punto ideal de desarrollo de pupas
    "temp_min_cria":         34.0,   # °C — límite inferior tolerable para cría
    "temp_max_cria":         36.0,   # °C — límite superior tolerable para cría
    "temp_critica_inferior": 32.0,   # °C — por debajo: desarrollo retardado
    "temp_critica_superior": 38.0,   # °C — por encima: daño irreversible a pupas
    "temp_muerte_frio":      10.0,   # °C — coma por frío (adultas)
    "temp_muerte_calor":     45.0,   # °C — muerte por calor (adultas)

    # ── Humedad relativa ─────────────────────────────────────────────────────
    # El nido de cría mantiene 50-75 % RH (Human et al., 2006)
    # Huevos requieren > 55 % para eclosionar (Doull, 1976)
    # Zona de almacenamiento de miel: 50-60 % RH (Seeley, 1995)
    "hum_optima_centro":     60.0,   # % — punto medio del rango de cría
    "hum_min_cria":          50.0,   # % — < 50 % los huevos se deshidratan
    "hum_max_cria":          75.0,   # % — > 75 % riesgo de moho y hongos
    "hum_min_huevos":        55.0,   # % — mínimo para eclosión exitosa
    "hum_max_miel":          60.0,   # % — límite para evitar fermentación de miel
    "hum_critica_inferior":  40.0,   # % — estrés severo por deshidratación
    "hum_critica_superior":  80.0,   # % — proliferación de Varroa y hongos

    # ── Impacto en la cría por temperatura fuera de rango ────────────────────
    # Referencia: Seeley et al. (2003); Fahrenholz et al. (1989)
    "penalizacion_por_grado_frio":  50.0,   # fitness adicional por °C < 34
    "penalizacion_por_grado_calor": 50.0,   # fitness adicional por °C > 36
    "penalizacion_por_pct_hum_baja":20.0,   # fitness adicional por % < 50
    "penalizacion_por_pct_hum_alta":15.0,   # fitness adicional por % > 75
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. MODELO TERMODINÁMICO EMPÍRICO
#
#    Basado en el modelo de balance energético de Mitchell (2019) y las
#    constantes empíricas de Kronenberg & Heller (1982).
#
#    Fórmula de temperatura proyectada:
#      T_proj = T_actual + Q_interno - ΔT_vent - ΔT_sombra
#
#    Fórmula de humedad proyectada:
#      H_proj = H_actual + ΔH_agua - ΔH_vent + ΔH_jarabe
#
#    Donde cada coeficiente tiene unidades y significado físico explícito.
# ─────────────────────────────────────────────────────────────────────────────
MODELO_TERMICO = {

    # ── Calor interno generado por la colonia ────────────────────────────────
    # Las abejas generan calor metabólico constante para mantener la cría.
    # Una colonia de 30,000–50,000 abejas produce ~25–40 W de calor.
    # En términos prácticos: +1.5 °C cada 15 min sin intervención externa.
    "calor_interno_colonia":   1.5,   # °C / ciclo (15 min)

    # ── Efecto de la ventilación ─────────────────────────────────────────────
    # Apertura de piqueras y mallas. A 100 % de ventilación, el flujo de
    # aire reduce la temperatura ~5 °C (Kronenberg & Heller, 1982).
    # k_vent = 5 °C / 100 % = 0.05 °C por cada 1 % de apertura.
    # También SECA el ambiente: a 100% vent se pierde ~10 % RH por ciclo.
    "k_vent_temp":  0.05,   # °C de enfriamiento por 1 % de ventilación
    "k_vent_hum":   0.10,   # % RH perdida por 1 % de ventilación

    # ── Efecto de la sombra/aislamiento térmico ──────────────────────────────
    # Malla sombra al 60 % reduce la ganancia de calor radiante ~2 °C.
    # Aplicable solo en condiciones de alta irradiancia solar (verano/Chiapas).
    "k_sombra_temp":2.0,    # °C de enfriamiento adicional si sombra = True

    # ── Efecto del agua en bebedero interno (esponja/bebedero) ──────────────
    # Al evaporarse, cada ml de agua absorbe ~0.54 cal ≈ enfría el aire.
    # Empíricamente: 1 ml de agua ≈ +0.15 % RH dentro de la colmena
    # y un leve efecto de enfriamiento por evaporación.
    "k_agua_hum":   0.15,   # % RH ganada por ml de agua suministrada
    "k_agua_temp": -0.01,   # °C de enfriamiento adicional por ml (evaporación)

    # ── Efecto del jarabe/alimento suplementario ─────────────────────────────
    # El jarabe azucarado (1:1 agua:azúcar) es principalmente energético.
    # Su metabolización genera calor y humedad metabólica.
    # Empíricamente: +0.05 % RH por gramo de jarabe suministrado.
    "k_jarabe_hum": 0.05,   # % RH ganada por g de jarabe (humedad metabólica)
    "k_jarabe_temp":0.02,   # °C de calor metabólico adicional por g de jarabe
}


# ─────────────────────────────────────────────────────────────────────────────
# 3. TABLA DE COSTOS DE INSUMOS
#
#    Fuentes:
#      - Azúcar/jarabe: SAGARPA/Cofemersimir (2018) — ~$22 MXN/kg azúcar
#        + preparación = ~$0.30 MXN/g de jarabe
#      - Agua: Costo operativo de suministro rural Mexico ~$0.002 MXN/ml
#        (insignificante, pero incluido para rigor metodológico)
#      - Sombra/malla: Material reutilizable. Costo amortizado por uso:
#        malla $500 MXN, vida útil ~500 aplicaciones = $1.00 MXN/uso
#      - Mano de obra: Salario mínimo México 2024 = $248.93 MXN/día (8h).
#        Equivale a ~$31.12 MXN/hora o ~$0.519 MXN/minuto.
#        Una intervención apícola toma ~30 min → ~$15.60 MXN fijo.
#        (Magaña & Leyva, 2011; IMSS/STPS 2024)
# ─────────────────────────────────────────────────────────────────────────────
TABLA_COSTOS = {
    # Costo por unidad de cada insumo (en pesos MXN)
    "costo_agua_por_ml":       0.002,   # MXN/ml  — agua potable rural
    "costo_jarabe_por_g":      0.30,    # MXN/g   — jarabe azúcar 1:1 (~$22/kg + prep)
    "costo_sombra_por_uso":    1.00,    # MXN/uso — malla sombra amortizada
    "costo_mano_obra_por_min": 0.52,    # MXN/min — salario mínimo 2024

    # Tiempo estimado que tarda el apicultor en cada intervención (minutos)
    "tiempo_agua_min":    5.0,   # instalar bebedero o cargar esponja
    "tiempo_jarabe_min":  8.0,   # preparar y colocar alimentador
    "tiempo_sombra_min": 15.0,   # instalar/retirar malla sombra exterior
    "tiempo_vent_min":    3.0,   # ajustar ventilación (piquera/malla)

    # Multiplicador de urgencia: si la temperatura es crítica (>38 °C o <32 °C)
    # el apicultor debe ir de inmediato → costo de transporte extra
    "costo_urgencia_base": 50.0,  # MXN — costo de viaje de emergencia al apiario
}


# ─────────────────────────────────────────────────────────────────────────────
# 4. FUNCIÓN AUXILIAR: calcular costo total de una intervención
# ─────────────────────────────────────────────────────────────────────────────
def calcular_costo_intervencion(agua_ml: float, jarabe_g: float,
                                 sombra: bool, vent_pct: float,
                                 es_urgente: bool = False) -> dict:
    """
    Calcula el costo económico desglosado de una intervención apícola.

    Parámetros
    ----------
    agua_ml   : volumen de agua suministrado (ml)
    jarabe_g  : masa de jarabe suministrado (g)
    sombra    : True si se instala malla sombra exterior
    vent_pct  : porcentaje de apertura de ventilación (0–100)
    es_urgente: True si la temp está fuera del rango crítico

    Retorna
    -------
    dict con desglose por insumo y costo total en MXN
    """
    c = TABLA_COSTOS

    c_agua   = agua_ml   * c["costo_agua_por_ml"]
    c_jarabe = jarabe_g  * c["costo_jarabe_por_g"]
    c_sombra = c["costo_sombra_por_uso"] if sombra else 0.0

    # Mano de obra por cada tarea realizada
    mo_agua   = c["tiempo_agua_min"]   * c["costo_mano_obra_por_min"] if agua_ml > 0   else 0.0
    mo_jarabe = c["tiempo_jarabe_min"] * c["costo_mano_obra_por_min"] if jarabe_g > 0  else 0.0
    mo_sombra = c["tiempo_sombra_min"] * c["costo_mano_obra_por_min"] if sombra        else 0.0
    mo_vent   = c["tiempo_vent_min"]   * c["costo_mano_obra_por_min"] if vent_pct > 0  else 0.0
    mo_total  = mo_agua + mo_jarabe + mo_sombra + mo_vent

    c_urgencia = c["costo_urgencia_base"] if es_urgente else 0.0

    total = c_agua + c_jarabe + c_sombra + mo_total + c_urgencia

    return {
        "costo_agua_MXN":    round(c_agua,    4),
        "costo_jarabe_MXN":  round(c_jarabe,  4),
        "costo_sombra_MXN":  round(c_sombra,  4),
        "mano_obra_MXN":     round(mo_total,  4),
        "costo_urgencia_MXN":round(c_urgencia,4),
        "costo_total_MXN":   round(total,     4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. FUNCIÓN AUXILIAR: diagnosticar estado de la colmena
# ─────────────────────────────────────────────────────────────────────────────
def diagnosticar_colmena(temp: float, hum: float) -> dict:
    """
    Clasifica el estado actual de la colmena según los rangos biológicos.

    Retorna un dict con nivel de alerta, descripción y si es urgente.
    """
    r = RANGOS_BIOLOGICOS

    # ── Temperatura ──
    if r["temp_min_cria"] <= temp <= r["temp_max_cria"]:
        estado_temp = "ÓPTIMO"
        alerta_temp = 0
    elif r["temp_critica_inferior"] <= temp < r["temp_min_cria"]:
        estado_temp = "FRÍO — riesgo de desarrollo retardado"
        alerta_temp = 1
    elif r["temp_max_cria"] < temp <= r["temp_critica_superior"]:
        estado_temp = "CALOR — estrés térmico leve"
        alerta_temp = 1
    elif temp < r["temp_critica_inferior"]:
        estado_temp = "FRÍO CRÍTICO — posible muerte de cría"
        alerta_temp = 2
    else:
        estado_temp = "CALOR CRÍTICO — daño irreversible a pupas"
        alerta_temp = 2

    # ── Humedad ──
    if r["hum_min_cria"] <= hum <= r["hum_max_cria"]:
        estado_hum = "ÓPTIMO"
        alerta_hum = 0
    elif r["hum_critica_inferior"] <= hum < r["hum_min_cria"]:
        estado_hum = "SECO — huevos en riesgo de deshidratación"
        alerta_hum = 1
    elif r["hum_max_cria"] < hum <= r["hum_critica_superior"]:
        estado_hum = "HÚMEDO — riesgo de hongos"
        alerta_hum = 1
    elif hum < r["hum_critica_inferior"]:
        estado_hum = "SEQUÍA CRÍTICA — cría muriendo"
        alerta_hum = 2
    else:
        estado_hum = "HUMEDAD CRÍTICA — Varroa y moho"
        alerta_hum = 2

    es_urgente = (alerta_temp == 2) or (alerta_hum == 2)
    nivel_max  = max(alerta_temp, alerta_hum)
    etiqueta   = ["✅ Normal", "⚠ Alerta", "🚨 Crítico"][nivel_max]

    return {
        "estado_temp": estado_temp,
        "alerta_temp": alerta_temp,
        "estado_hum":  estado_hum,
        "alerta_hum":  alerta_hum,
        "es_urgente":  es_urgente,
        "nivel_general": etiqueta,
    }