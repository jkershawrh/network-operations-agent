FROM registry.access.redhat.com/ubi9/python-311:latest

WORKDIR /opt/network-operations-agent
COPY --chown=1001:0 src/ ./src/
COPY --chown=1001:0 data/ ./data/
COPY --chown=1001:0 web/ ./web/

ENV PYTHONPATH=/opt/network-operations-agent/src \
    NETWORK_OPS_CONTAINER_MODE=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 8080
USER 1001
CMD ["python3", "-m", "network_ops", "serve"]
