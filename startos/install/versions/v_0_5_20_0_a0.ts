import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_20_0_a0 = VersionInfo.of({
  version: '0.5.20:1-alpha.0',
  releaseNotes: {
    en_US:
      'Update packaged Buzz source to desktop-v0.5.20. This release adds KLIPY GIF search to composers, fixes automatic mention preference after send, attributes desktop candidates to the operator, and checks out source in docker.yml merge job. The StartOS wrapper continues to run the Buzz relay with PostgreSQL, Redis, and MinIO.',
    es_ES:
      'Actualiza el código fuente empaquetado de Buzz a desktop-v0.5.20. Esta versión upstream incluye la búsqueda de GIF KLIPY en los compositores, corrige la preferencia de mención automática después de enviar, atribuye los candidatos de escritorio al operador y verifica el origen en el trabajo de fusión docker.yml. El paquete StartOS sigue ejecutando la imagen publicada del relay de Buzz con PostgreSQL, Redis y MinIO.',
    de_DE:
      'Aktualisiert die paketierte Buzz-Quelle auf desktop-v0.5.20. Diese Upstream-Version fügt die KLIPY GIF-Suche zu Komponisten hinzu, behebt die automatische Erwähnungseinstellung nach dem Senden, weist Desktop-Kandidaten dem Operator zu und überprüft den Quellcode im docker.yml-Merge-Job. Das StartOS-Paket nutzt weiterhin das veröffentlichte Buzz-Relay-Image mit PostgreSQL, Redis und MinIO.',
    pl_PL:
      'Aktualizuje spakowane źródła Buzz do desktop-v0.5.20. To wydanie upstream dodaje wyszukiwanie GIF KLIPY do kompozytorów, naprawia automatyczne preferencje wspomnienia po wysłaniu, przypisuje kandydatów desktopowych operatorowi i sprawdza źródło zadaniu scalenia docker.yml. Pakiet StartOS nadal uruchamia opublikowany obraz przekaźnika Buzz z PostgreSQL, Redis i MinIO.',
    fr_FR:
      'Met à jour la source Buzz empaquetée vers desktop-v0.5.20. Cette version amont ajoute la recherche de GIF KLIPY aux compositeurs, corrige la préférence de mention automatique après l’envoi, attribue les candidats de bureau à l’opérateur et vérifie la source dans le travail de fusion docker.yml. Le paquet StartOS continue d’exécuter l’image publiée du relais Buzz avec PostgreSQL, Redis et MinIO.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})