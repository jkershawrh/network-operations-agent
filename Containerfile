FROM registry.access.redhat.com/ubi9/nodejs-22-minimal@sha256:9823eba78a979ab9b4346a91678d74518bdeb1fc762752689bf1354cbc492b54 AS story-builder

WORKDIR /opt/story
COPY --chown=1001:0 presentation/package.json presentation/package-lock.json ./
RUN npm ci
COPY --chown=1001:0 presentation/ ./
RUN npm run build

FROM registry.access.redhat.com/ubi9/python-311@sha256:a0bdb55576fc5b8d6704279307817828ef027e1065533ceba133fe9516003a6c

WORKDIR /opt/network-operations-agent
COPY --chown=1001:0 src/ ./src/
COPY --chown=1001:0 data/ ./data/
COPY --chown=1001:0 web/ ./web/
COPY --from=story-builder --chown=1001:0 /opt/story/dist/ ./presentation/
COPY --chown=1001:0 learner-templates/ ./learner-templates/
COPY --chown=1001:0 requirements-mcp.txt ./requirements-mcp.txt
RUN pip install --no-cache-dir -r requirements-mcp.txt

ENV PYTHONPATH=/opt/network-operations-agent/src \
    NETWORK_OPS_CONTAINER_MODE=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 8080 8095
USER 1001
CMD ["python3", "-m", "network_ops", "serve"]
