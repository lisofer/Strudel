import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorCode,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import {
  RECOGNITION_LANGUAGE,
  REQUIRE_ON_DEVICE_RECOGNITION,
} from "../config/speech";

export type StartListeningResult =
  | { status: "started" }
  | { status: "permission-denied"; canAskAgain: boolean }
  | { status: "unavailable" }
  | { status: "error" };

const joinTranscript = (base: string, addition: string): string => {
  const cleanBase = base.trim();
  const cleanAddition = addition.trim();

  if (!cleanAddition) return cleanBase;
  if (!cleanBase) return cleanAddition;
  return `${cleanBase} ${cleanAddition}`;
};

const getErrorMessage = (error: ExpoSpeechRecognitionErrorCode): string => {
  switch (error) {
    case "network":
      return "No hay conexión suficiente para reconocer la voz.";
    case "not-allowed":
      return "Falta permiso para usar el micrófono.";
    case "service-not-allowed":
      return "El reconocimiento de voz no está disponible en este teléfono.";
    case "language-not-supported":
      return "El reconocimiento no admite español de Argentina en este equipo.";
    case "audio-capture":
      return "No se pudo acceder al micrófono.";
    case "interrupted":
      return "La escucha fue interrumpida por otra función del teléfono.";
    case "busy":
      return "El reconocedor está ocupado. Intentando reanudar.";
    case "client":
    case "unknown":
      return "Se produjo un error del reconocimiento de voz.";
    default:
      return "No se pudo continuar con la transcripción.";
  }
};

export function useLiveTranscription() {
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Tocá “Comenzar a escuchar” para iniciar.",
  );

  const finalTextRef = useRef("");
  const interimTextRef = useRef("");
  const wantsToListenRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const endStatusMessageRef = useRef<string | null>(null);

  const supportsNativeContinuousRecognition =
    Platform.OS === "ios" ||
    (Platform.OS === "android" && Number(Platform.Version) >= 33);

  const updateFinalText = useCallback((value: string) => {
    finalTextRef.current = value;
    setFinalText(value);
  }, []);

  const updateInterimText = useCallback((value: string) => {
    interimTextRef.current = value;
    setInterimText(value);
  }, []);

  const commitInterimText = useCallback(() => {
    const pendingText = interimTextRef.current.trim();
    if (!pendingText) return;

    updateFinalText(joinTranscript(finalTextRef.current, pendingText));
    updateInterimText("");
  }, [updateFinalText, updateInterimText]);

  const beginRecognition = useCallback(() => {
    if (!wantsToListenRef.current || !isMountedRef.current) return;

    try {
      endStatusMessageRef.current = null;
      ExpoSpeechRecognitionModule.start({
        lang: RECOGNITION_LANGUAGE,
        interimResults: true,
        maxAlternatives: 1,
        continuous: supportsNativeContinuousRecognition,
        requiresOnDeviceRecognition: REQUIRE_ON_DEVICE_RECOGNITION,
        addsPunctuation: true,
        iosTaskHint: "dictation",
        recordingOptions: {
          persist: false,
        },
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
        },
      });
    } catch (error) {
      wantsToListenRef.current = false;
      setIsStarting(false);
      setIsListening(false);
      setStatusMessage("No se pudo iniciar el reconocimiento de voz.");
      console.warn("Error al iniciar el reconocimiento:", error);
    }
  }, [supportsNativeContinuousRecognition]);

  useSpeechRecognitionEvent("start", () => {
    setIsStarting(false);
    setIsListening(true);
    setStatusMessage("Escuchando. Podés hablar.");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const recognizedText = event.results[0]?.transcript?.trim() ?? "";
    if (!recognizedText) return;

    if (event.isFinal) {
      updateFinalText(joinTranscript(finalTextRef.current, recognizedText));
      updateInterimText("");
      setStatusMessage("Escuchando. La transcripción está actualizada.");
      return;
    }

    updateInterimText(recognizedText);
    setStatusMessage("Detectando voz…");
  });

  useSpeechRecognitionEvent("nomatch", () => {
    if (wantsToListenRef.current) {
      setStatusMessage("No pude reconocer esa parte. Sigo escuchando.");
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    setIsStarting(false);

    if (event.error === "aborted" && !wantsToListenRef.current) return;

    if (event.error === "no-speech" || event.error === "speech-timeout") {
      if (wantsToListenRef.current) {
        setStatusMessage("No detecté voz. Sigo escuchando.");
      }
      return;
    }

    const recoverable =
      event.error === "busy" || event.error === "client" || event.error === "unknown";

    const message = getErrorMessage(event.error);

    if (!recoverable) {
      wantsToListenRef.current = false;
      endStatusMessageRef.current = message;
    }

    setStatusMessage(message);
    console.warn(
      `Reconocimiento de voz: ${event.error} (${event.code ?? "sin código"})`,
      event.message,
    );
  });

  useSpeechRecognitionEvent("end", () => {
    commitInterimText();
    setIsListening(false);
    setIsStarting(false);

    if (!wantsToListenRef.current) {
      setStatusMessage(
        endStatusMessageRef.current ??
          "Transcripción detenida. El texto permanece en pantalla.",
      );
      endStatusMessageRef.current = null;
      return;
    }

    setStatusMessage("Reanudando la escucha…");
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(beginRecognition, 450);
  });

  const startListening = useCallback(async (): Promise<StartListeningResult> => {
    if (isListening || isStarting || wantsToListenRef.current) {
      return { status: "started" };
    }

    setIsStarting(true);
    setStatusMessage("Comprobando el micrófono…");

    try {
      const recognitionAvailable =
        ExpoSpeechRecognitionModule.isRecognitionAvailable();

      if (!recognitionAvailable) {
        setIsStarting(false);
        setStatusMessage(
          "El reconocimiento de voz no está disponible en este teléfono.",
        );
        return { status: "unavailable" };
      }

      if (
        REQUIRE_ON_DEVICE_RECOGNITION &&
        !ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
      ) {
        setIsStarting(false);
        setStatusMessage(
          "Este teléfono no admite reconocimiento de voz sin conexión.",
        );
        return { status: "unavailable" };
      }

      setStatusMessage("Solicitando permiso para usar el micrófono…");
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        setIsStarting(false);
        setStatusMessage(
          "Permiso denegado. Habilitá el micrófono para transcribir.",
        );
        return {
          status: "permission-denied",
          canAskAgain: permission.canAskAgain,
        };
      }

      wantsToListenRef.current = true;
      setStatusMessage("Iniciando la escucha…");
      beginRecognition();
      return { status: "started" };
    } catch (error) {
      wantsToListenRef.current = false;
      setIsStarting(false);
      setStatusMessage("No se pudo preparar el reconocimiento de voz.");
      console.warn("Error al solicitar permisos:", error);
      return { status: "error" };
    }
  }, [beginRecognition, isListening, isStarting]);

  const stopListening = useCallback(() => {
    wantsToListenRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    endStatusMessageRef.current =
      "Transcripción detenida. El texto permanece en pantalla.";
    setStatusMessage("Procesando las últimas palabras…");

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      commitInterimText();
      setIsListening(false);
      setIsStarting(false);
      setStatusMessage("Transcripción detenida.");
      console.warn("Error al detener el reconocimiento:", error);
    }
  }, [commitInterimText]);

  const clearTranscript = useCallback(() => {
    updateFinalText("");
    updateInterimText("");
    setStatusMessage(
      wantsToListenRef.current
        ? "Texto borrado. El micrófono sigue escuchando."
        : "Transcripción borrada.",
    );
  }, [updateFinalText, updateInterimText]);

  const replaceTranscript = useCallback(
    (text: string) => {
      updateFinalText(text.trim());
      updateInterimText("");
      setStatusMessage("Transcripción guardada cargada en pantalla.");
    },
    [updateFinalText, updateInterimText],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && wantsToListenRef.current) {
        wantsToListenRef.current = false;
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {
          ExpoSpeechRecognitionModule.abort();
        }
        endStatusMessageRef.current =
          "La escucha se detuvo al salir de la aplicación.";
        setStatusMessage("La escucha se detuvo al salir de la aplicación.");
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      wantsToListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // El reconocedor ya estaba inactivo.
      }
    };
  }, []);

  const completeText = useMemo(
    () => [finalText.trim(), interimText.trim()].filter(Boolean).join(" "),
    [finalText, interimText],
  );

  return {
    finalText,
    interimText,
    completeText,
    isListening,
    isStarting,
    statusMessage,
    startListening,
    stopListening,
    clearTranscript,
    replaceTranscript,
  };
}
