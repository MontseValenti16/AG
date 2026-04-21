"""
Modelo termodinámico empírico de la colmena.
Todos los coeficientes provienen de base_conocimiento.py.
"""
from base_conocimiento import MODELO_TERMICO, RANGOS_BIOLOGICOS, TABLA_COSTOS, diagnosticar_colmena


class SimuladorColmena:
    """
    """

    def __init__(self, temp_inicial: float, hum_inicial: float):
        self.temp_actual = temp_inicial
        self.hum_actual  = hum_inicial

        self.calor_interno  = MODELO_TERMICO["calor_interno_colonia"]
        self.k1_vent        = MODELO_TERMICO["k_vent_temp"]
        self.k_vent_hum     = MODELO_TERMICO["k_vent_hum"]
        self.k3_sombra      = MODELO_TERMICO["k_sombra_temp"]
        self.k_agua_hum     = MODELO_TERMICO["k_agua_hum"]
        self.k_agua_temp    = MODELO_TERMICO["k_agua_temp"]
        self.k_jarabe_hum   = MODELO_TERMICO["k_jarabe_hum"]
        self.k_jarabe_temp  = MODELO_TERMICO["k_jarabe_temp"]

        self.costo_agua      = TABLA_COSTOS["costo_agua_por_ml"]
        self.costo_alimento  = TABLA_COSTOS["costo_jarabe_por_g"]
        self.costo_sombra    = TABLA_COSTOS["costo_sombra_por_uso"]
        self.costo_mo_min    = TABLA_COSTOS["costo_mano_obra_por_min"]

        self._t_agua   = TABLA_COSTOS["tiempo_agua_min"]
        self._t_jarabe = TABLA_COSTOS["tiempo_jarabe_min"]
        self._t_sombra = TABLA_COSTOS["tiempo_sombra_min"]
        self._t_vent   = TABLA_COSTOS["tiempo_vent_min"]
        self._costo_urgencia = TABLA_COSTOS["costo_urgencia_base"]

    def proyectar_estado(self, ventilacion: float, agua: float,
                         sombra: bool, jarabe: float = 0.0) -> tuple[float, float]:
        """
        Proyecta temperatura y humedad resultantes de una intervención.

        Fórmulas (modelo termodinámico empírico):
          T_proj = T_actual + Q_interno
                   - vent  * k_vent_temp
                   - sombra * k_sombra
                   + jarabe * k_jarabe_temp
                   + agua   * k_agua_temp     (enfriamiento evaporativo)

          H_proj = H_actual
                   + agua   * k_agua_hum
                   - vent   * k_vent_hum
                   + jarabe * k_jarabe_hum

        Parámetros
        ----------
        ventilacion : apertura de piquera/malla (0–100 %)
        agua        : volumen en bebedero (ml)
        sombra      : malla sombra exterior (bool)
        jarabe      : alimento suplementario (g) — ahora afecta al modelo
        """
        # Temperatura
        delta_sombra = self.k3_sombra if sombra else 0.0
        temp_proj = (
            self.temp_actual
            + self.calor_interno
            - ventilacion * self.k1_vent
            - delta_sombra
            + jarabe * self.k_jarabe_temp
            + agua   * self.k_agua_temp
        )

        # Humedad
        hum_proj = (
            self.hum_actual
            + agua   * self.k_agua_hum
            - ventilacion * self.k_vent_hum
            + jarabe * self.k_jarabe_hum
        )

        hum_proj = max(10.0, min(95.0, hum_proj))

        return temp_proj, hum_proj

    def aplicar_accion_real(self, ventilacion: float, agua: float,
                             alimento: float, sombra: bool) -> tuple[float, float, float]:
        """
        Aplica la acción al estado real de la colmena.
        Calcula el costo económico total de la intervención.

        El costo incluye:
          - Costo de insumos (agua, jarabe, sombra)
          - Mano de obra proporcional a las tareas realizadas
          - Sobrecargo de urgencia si la temp es crítica
        """
        self.temp_actual, self.hum_actual = self.proyectar_estado(
            ventilacion, agua, sombra, alimento
        )

        diagnostico  = diagnosticar_colmena(self.temp_actual, self.hum_actual)
        es_urgente   = diagnostico["es_urgente"]

        # ── Costo de insumos 
        c_agua    = agua     * self.costo_agua
        c_jarabe  = alimento * self.costo_alimento
        c_sombra  = self.costo_sombra if sombra else 0.0

        # ── Mano de obra 
        mo  = 0.0
        if agua     > 0: mo += self._t_agua   * self.costo_mo_min
        if alimento > 0: mo += self._t_jarabe * self.costo_mo_min
        if sombra:       mo += self._t_sombra * self.costo_mo_min
        if ventilacion > 0: mo += self._t_vent * self.costo_mo_min

        c_urgencia = self._costo_urgencia if es_urgente else 0.0

        costo_total = c_agua + c_jarabe + c_sombra + mo + c_urgencia

        return self.temp_actual, self.hum_actual, round(costo_total, 4)

    def diagnostico_actual(self) -> dict:
        """Retorna el diagnóstico biológico del estado presente."""
        return diagnosticar_colmena(self.temp_actual, self.hum_actual)