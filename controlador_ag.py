"""
controlador_ag.py — BEEHIVECTRL
Algoritmo Genético Dinámico para optimización de intervenciones apícolas.
La función de fitness usa directamente los rangos biológicos validados.
"""
import random
from base_conocimiento import RANGOS_BIOLOGICOS, TABLA_COSTOS


class ControladorAG:
    """

    Cromosoma (individuo): [ventilacion, agua, jarabe, sombra]
      - ventilacion: float 0–100  (% apertura piquera/malla)
      - agua:        float 15–60  (ml en bebedero interno)
      - jarabe:      float 5–25   (g de jarabe azucarado 1:1)
      - sombra:      int   0 o 1  (malla sombra exterior)

    La función de fitness minimiza simultáneamente:
      F(x) = penalización_temp + penalización_hum
            + peso_costo * costo_económico
            + peso_tiempo * tiempo_estabilización
    """

    def __init__(self, tam_poblacion: int = 50, generaciones: int = 20):
        self.tam_poblacion = tam_poblacion
        self.generaciones  = generaciones

        # Pesos de la función objetivo multicriterio 
        self.peso_costo  = 1.0
        self.peso_tiempo = 1.0

        # Rangos biológicos y penalizaciones (desde base de conocimiento) 
        r = RANGOS_BIOLOGICOS
        self.t_ideal     = r["temp_optima_cria"]       # 35.0 °C
        self.t_min_ok    = r["temp_min_cria"]           # 34.0 °C
        self.t_max_ok    = r["temp_max_cria"]           # 36.0 °C
        self.h_min_ok    = r["hum_min_cria"]            # 50.0 %
        self.h_max_ok    = r["hum_max_cria"]            # 75.0 %
        self.pen_temp_c  = r["penalizacion_por_grado_frio"]   # 50.0
        self.pen_temp_h  = r["penalizacion_por_grado_calor"]  # 50.0
        self.pen_hum_b   = r["penalizacion_por_pct_hum_baja"] # 20.0
        self.pen_hum_a   = r["penalizacion_por_pct_hum_alta"] # 15.0

        # ── Costos de insumos (desde base de conocimiento) 
        c = TABLA_COSTOS
        self.costo_agua      = c["costo_agua_por_ml"]
        self.costo_alimento  = c["costo_jarabe_por_g"]
        self.costo_sombra    = c["costo_sombra_por_uso"]

    
    def generar_individuo_aleatorio(self) -> list:
        return [
            random.randint(0, 100),         # ventilación (%)
            random.uniform(15.0, 60.0),     # agua (ml)
            random.uniform(5.0, 25.0),      # jarabe (g)
            random.choice([0, 1])           # sombra (booleano)
        ]

    def calcular_fitness(self, individuo: list, simulador_actual) -> float:
        """
        Función de aptitud multicriterio.

        Objetivo 1 — Desviación biológica:
          Penaliza cualquier desviación de temperatura o humedad fuera
          de los rangos óptimos de Apis mellifera.

        Objetivo 2 — Costo económico (O2):
          Suma el precio de los insumos usados.

        Objetivo 3 — Tiempo de estabilización (O3):
          Estima cuántos ciclos tardará en llegar al óptimo dado el
          nivel de intervención elegido.

        Penalizaciones vitales:
          Si agua < 15 ml o jarabe < 5 g, la intervención es inviable.
        """
        vent, agua, jarabe, sombra = individuo
        sombra_bool = bool(sombra)

        t_pred, h_pred = simulador_actual.proyectar_estado(
            vent, agua, sombra_bool, jarabe
        )

        if t_pred < self.t_min_ok:
            pen_temp = (self.t_min_ok - t_pred) * self.pen_temp_c
        elif t_pred > self.t_max_ok:
            pen_temp = (t_pred - self.t_max_ok) * self.pen_temp_h
        else:
            pen_temp = 0.0

        if h_pred < self.h_min_ok:
            pen_hum = (self.h_min_ok - h_pred) * self.pen_hum_b
        elif h_pred > self.h_max_ok:
            pen_hum = (h_pred - self.h_max_ok) * self.pen_hum_a
        else:
            pen_hum = 0.0

        o2_costo = (
            (agua   * self.costo_agua)    +
            (jarabe * self.costo_alimento)+
            (sombra * self.costo_sombra)
        )

        fuerza_accion = (
            (vent   * simulador_actual.k1_vent)  +
            (sombra * simulador_actual.k3_sombra)+
            0.001
        )
        o3_tiempo = abs(simulador_actual.temp_actual - self.t_ideal) / fuerza_accion

        fitness_base = (
            pen_temp +
            pen_hum  +
            self.peso_costo  * o2_costo  +
            self.peso_tiempo * o3_tiempo
        )

        pen_vital = 0.0
        if agua   < 15.0: pen_vital += 1000.0
        if jarabe <  5.0: pen_vital += 1000.0

        return fitness_base + pen_vital

    def obtener_mejor_accion(self, simulador_actual) -> tuple:
        """
        Ejecuta el ciclo completo del AG y retorna la mejor acción encontrada.

        Retorna
        -------
        mejor_individuo : list  — [vent, agua, jarabe, sombra]
        mejor_fitness   : float
        historial_mejor : list  — fitness del mejor por generación
        historial_prom  : list  — fitness promedio por generación
        """

        poblacion = [self.generar_individuo_aleatorio()
                     for _ in range(self.tam_poblacion)]

        historial_mejor   = []
        historial_promedio = []

        for _ in range(self.generaciones):
            eval_pob = []
            suma_fit = 0.0
            for ind in poblacion:
                f = self.calcular_fitness(ind, simulador_actual)
                eval_pob.append((f, ind))
                suma_fit += f

            eval_pob.sort(key=lambda x: x[0])
            historial_mejor.append(eval_pob[0][0])
            historial_promedio.append(suma_fit / self.tam_poblacion)

            elite = [ind for _, ind in eval_pob[:self.tam_poblacion // 2]]
            nueva_pob = elite.copy()

            while len(nueva_pob) < self.tam_poblacion:
                padre_a = random.choice(elite)
                padre_b = random.choice(elite)
                alfa    = random.random()

                hijo = [
                    alfa * padre_a[0] + (1 - alfa) * padre_b[0],
                    alfa * padre_a[1] + (1 - alfa) * padre_b[1],
                    alfa * padre_a[2] + (1 - alfa) * padre_b[2],
                    random.choice([padre_a[3], padre_b[3]])
                ]

                mutante = [
                    max(0.0,  min(100.0, hijo[0] + random.randint(-10, 10))),
                    max(15.0,            hijo[1] + random.uniform(-5, 5)),
                    max(5.0,             hijo[2] + random.uniform(-2, 2)),
                    hijo[3]
                ]
                if random.random() < 0.10:  
                    mutante[3] = 1 if mutante[3] == 0 else 0

                nueva_pob.append(mutante)

            poblacion = nueva_pob

        eval_final = [(self.calcular_fitness(ind, simulador_actual), ind)
                      for ind in poblacion]
        eval_final.sort(key=lambda x: x[0])
        mejor_fitness, mejor_individuo = eval_final[0]

        return mejor_individuo, mejor_fitness, historial_mejor, historial_promedio