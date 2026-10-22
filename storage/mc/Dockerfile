# Official release assets, verified against upstream's published SHA256 files.
FROM alpine:3.22.2 AS download
RUN apk add --no-cache ca-certificates curl
ARG TARGETARCH
RUN case "$TARGETARCH" in \
      amd64) sum=01f866e9c5f9b87c2b09116fa5d7c06695b106242d829a8bb32990c00312e891 ;; \
      arm64) sum=14c8c9616cfce4636add161304353244e8de383b2e2752c0e9dad01d4c27c12c ;; \
      *) exit 1 ;; \
    esac \
 && curl -fsSL --retry 3 \
    "https://github.com/minio/mc/releases/download/RELEASE.2025-08-13T08-35-41Z/mc.linux-${TARGETARCH}.RELEASE.2025-08-13T08-35-41Z" -o /mc \
 && printf '%s  /mc\n' "$sum" | sha256sum -c - \
 && chmod 0755 /mc

FROM alpine:3.22.2
RUN apk add --no-cache ca-certificates
COPY --from=download /mc /usr/bin/mc
ENTRYPOINT ["/usr/bin/mc"]
