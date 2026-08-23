import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_18_0_a0 = VersionInfo.of({
  version: '0.5.18:0-alpha.0',
  releaseNotes: {
    en_US:
      'Update packaged Buzz source to desktop-v0.5.18. This desktop-focused upstream release includes Projects navigation and collaboration refinements, workflow editor support, compact Buzz link metadata, reconnect and notification fixes, repository tree fixes, media handling fixes, and desktop/web performance improvements. The StartOS package continues to run the published Buzz relay image with PostgreSQL, Redis, and MinIO.',
    es_ES:
      'Actualiza el código fuente empaquetado de Buzz a desktop-v0.5.18. Esta versión upstream centrada en escritorio incluye mejoras de Projects, editor de workflows, metadatos compactos de enlaces Buzz, correcciones de reconexión/notificaciones/repositorios/medios y mejoras de rendimiento. El paquete StartOS sigue ejecutando la imagen publicada del relay de Buzz con PostgreSQL, Redis y MinIO.',
    de_DE:
      'Aktualisiert die paketierte Buzz-Quelle auf desktop-v0.5.18. Diese Desktop-orientierte Upstream-Version enthält Verbesserungen an Projects, Workflow-Editor, kompakten Buzz-Link-Metadaten, Reconnect-/Benachrichtigungs-/Repository-/Medien-Korrekturen und Performance-Verbesserungen. Das StartOS-Paket nutzt weiterhin das veröffentlichte Buzz-Relay-Image mit PostgreSQL, Redis und MinIO.',
    pl_PL:
      'Aktualizuje spakowane źródła Buzz do desktop-v0.5.18. To wydanie upstream skoncentrowane na desktopie obejmuje ulepszenia Projects, edytor workflow, kompaktowe metadane linków Buzz, poprawki ponownego łączenia/powiadomień/repozytoriów/mediów oraz usprawnienia wydajności. Pakiet StartOS nadal uruchamia opublikowany obraz przekaźnika Buzz z PostgreSQL, Redis i MinIO.',
    fr_FR:
      'Met à jour la source Buzz empaquetée vers desktop-v0.5.18. Cette version amont centrée sur le bureau inclut des améliorations de Projects, l’éditeur de workflows, les métadonnées compactes des liens Buzz, des correctifs de reconnexion/notifications/dépôts/médias et des améliorations de performance. Le paquet StartOS continue d’exécuter l’image publiée du relais Buzz avec PostgreSQL, Redis et MinIO.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
