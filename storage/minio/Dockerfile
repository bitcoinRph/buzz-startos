# Official MinIO security release; upstream publishes source only for this tag.
FROM golang:1.24.8-alpine3.22 AS build
RUN apk add --no-cache git ca-certificates
WORKDIR /src
RUN git init . \
 && git remote add origin https://github.com/minio/minio.git \
 && git fetch --depth 1 origin refs/tags/RELEASE.2025-10-15T17-29-55Z \
 && git checkout --detach FETCH_HEAD \
 && test "$(git rev-parse HEAD)" = 9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a
ARG TARGETOS=linux
ARG TARGETARCH
RUN flags="$(MINIO_RELEASE=RELEASE go run buildscripts/gen-ldflags.go 2025-10-15T17:29:55Z)" \
 && CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -tags kqueue -trimpath -ldflags "$flags" -o /out/minio .

FROM alpine:3.22.2
RUN apk add --no-cache ca-certificates
COPY --from=build /out/minio /usr/bin/minio
COPY --from=build /src/LICENSE /usr/share/licenses/minio/LICENSE
COPY NOTICE.md /usr/share/doc/minio/NOTICE.md
ENTRYPOINT ["/usr/bin/minio"]
CMD ["server", "/data"]
