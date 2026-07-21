/** Idioma principal del reconocedor, en formato BCP-47. */
export const RECOGNITION_LANGUAGE = "es-AR";

/**
 * false: usa el servicio de reconocimiento configurado por el sistema.
 * Puede necesitar internet, pero suele ofrecer mayor compatibilidad.
 *
 * true: obliga al reconocimiento local. Requiere un dispositivo compatible
 * y que el modelo de español esté previamente instalado.
 */
export const REQUIRE_ON_DEVICE_RECOGNITION = false;

/** Cantidad máxima de transcripciones guardadas localmente. */
export const MAX_SAVED_TRANSCRIPTIONS = 50;
