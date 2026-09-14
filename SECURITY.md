# Security

Report vulnerabilities privately to the repository owner. Do not include credentials, account identifiers, or conversation content in issues or logs.

## Credential handling

- WorkBuddy login credentials are read from a mounted file for each request. They are not stored in the image or repository.
- The local proxy has its own random API key, persisted in the Docker data volume or local `.api-key` file.
- Compose binds the published port to loopback and mounts the auth directory read-only.
- TLS verification is enabled for upstream requests. Use an explicit trusted CA where required.

Do not expose this personal gateway publicly without a separate deployment review. The free-model filter follows upstream configuration and is not an independent billing guarantee.
