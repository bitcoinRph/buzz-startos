import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_5_0 = VersionInfo.of({
  version: '0.5.5:0',
  releaseNotes: {
    en_US:
      'Update to Buzz 0.5.5. Pins the relay to the 0.5.5 release image and ' +
      'adds the Pair Mobile Device action. The database migrates forward in ' +
      'place from any consolidated-schema (post-1321) install; no reset is ' +
      'needed unless upgrading from the original 0.1.1 image.',
    es_ES:
      'Actualización a Buzz 0.5.5. Fija el relay a la imagen de la versión ' +
      '0.5.5 y añade la acción Emparejar dispositivo móvil. La base de datos ' +
      'migra hacia adelante desde cualquier instalación con esquema ' +
      'consolidado (post-1321); no hace falta reiniciarla salvo que vengas de ' +
      'la imagen 0.1.1 original.',
    de_DE:
      'Aktualisierung auf Buzz 0.5.5. Fixiert das Relay auf das 0.5.5-Release ' +
      'und ergänzt die Aktion „Mobilgerät koppeln“. Die Datenbank migriert von ' +
      'jeder Installation mit konsolidiertem Schema (nach 1321) vorwärts; ein ' +
      'Zurücksetzen ist nur beim Wechsel vom ursprünglichen 0.1.1-Image nötig.',
    pl_PL:
      'Aktualizacja do Buzz 0.5.5. Przypina relay do obrazu wydania 0.5.5 i ' +
      'dodaje akcję „Sparuj urządzenie mobilne”. Baza danych migruje w przód z ' +
      'każdej instalacji ze skonsolidowanym schematem (po 1321); reset jest ' +
      'potrzebny tylko przy aktualizacji z pierwotnego obrazu 0.1.1.',
    fr_FR:
      'Mise à jour vers Buzz 0.5.5. Épingle le relay sur l’image de la ' +
      'version 0.5.5 et ajoute l’action « Appairer un appareil mobile ». La ' +
      'base de données migre en avant depuis toute installation à schéma ' +
      'consolidé (post-1321) ; une réinitialisation n’est nécessaire que ' +
      'depuis l’image 0.1.1 d’origine.',
  },
  migrations: {
    // The Buzz relay applies its own SQLx migrations forward on startup
    // (BUZZ_AUTO_MIGRATE=true), so StartOS has no schema step of its own. The
    // 0.5.5 image ships a superset of migrations, so an existing
    // consolidated-schema volume upgrades in place.
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
