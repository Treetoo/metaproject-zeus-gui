
# MetaProject Zeus GUI

This application provides GUI for MetaProject Zeus.

MetaProject Zeus is project implemented as part of a master thesis for FI MUNI. It is a system used for managing projects related to HPC, their workflows and entities related to projects. Part of this system is integration with Perun, OpenStack and OIDC.


## Authors

- [Adam Valalský (@adamvalalsky)](https://www.github.com/adamvalalsky) - original author
- [Petr Balnar (@pitris90)](https://www.github.com/pitris90) - resource usage module, Openstack integration
- [Aleš Horna(@Treetoo)](https://www.github.com/Treetoo) - publication module


## Prerequisites
- Node.js 21
- Docker & Docker Compose (for local development)
- npm


## Run Locally

1. Clone project and navigate to the project directory.
1. Copy variables from `.env.example` to `.env`
1. Change variables accordingly (see section `Environment Variables`)

Then start server with Docker:

```bash
docker compose up --build
```


## Environment Variables

If you want to test this project, you need to copy variables from `.env.example` to `.env` and fill some variables with your values.

Most values are self-explanatory, are fine for local testing and don't have to be changed, but some values are confidential and should be configured correctly.

### Docker Base Images

```
BASE_IMAGE_NODE=node:21-alpine3.17
BASE_IMAGE_NGINX=nginxinc/nginx-unprivileged
```
Base images for Docker containers. Usually don't need to be changed unless upgrading versions.

### API Configuration

```
VITE_API_URL=http://localhost:3001
VITE_CLIENT_BASE_URL=http://localhost:5137
```
`VITE_API_URL` - URL where the main MetaProject Zeus API is running. For local development with Docker, use `http://localhost:3001`. `VITE_CLIENT_BASE_URL` - URL where this GUI application is accessible.

### OIDC Authentication

```
VITE_IDENTITY_AUTH_URL=https://login.e-infra.cz/oidc
VITE_IDENTITY_ISSUER=https://login.e-infra.cz/oidc
VITE_IDENTITY_CLIENT_ID=my-client
```
Used for logging in via OIDC. Need to use correct e-infra OIDC server. Client ID must be requested and obtained from https://spadmin.e-infra.cz/auth . After approving your request and clicking on particular service, in SAML/OIDC tab of your service you will see Client ID. Note: GUI only needs the Client ID, not the secret (public client).


## Deployment

When deploying this project, you have to build static files locally (in future, this process can be part of production pipeline).

First navigate to `web` folder:

```bash
cd web
```

Then install `node_modules` (if you ran `docker compose up`, `node_modules` folder may have permission conflicts so it is better to delete it first, if exists):

```bash
rm -rf node_modules && npm i
```

Then build production application:

```bash
npm run build
```

Resulting application is in `web/dist/` folder. It's only static HTML and JS, you can copy it to webserver.


## License

[MIT](https://choosealicense.com/licenses/mit/)

