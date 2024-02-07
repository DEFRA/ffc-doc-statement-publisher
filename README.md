# FFC Document Statement publisher

## Prerequisites

- Docker
- Docker Compose

Optional:
- Kubernetes
- Helm

## Azure Service Bus

This service depends on a valid Azure Service Bus connection string for
asynchronous communication.  The following environment variables need to be set
in any non-production (`!config.isProd`) environment before the Docker
container is started or tests are run. 

When deployed into an appropriately configured AKS
cluster (where [AAD Pod Identity](https://github.com/Azure/aad-pod-identity) is
configured) the microservice will use AAD Pod Identity.

| Name | Description |
| ---| --- |
| MESSAGE_QUEUE_HOST | Azure Service Bus hostname, e.g. `myservicebus.servicebus.windows.net` |
| MESSAGE_QUEUE_PASSWORD | Azure Service Bus SAS policy key |
| MESSAGE_QUEUE_USER | Azure Service Bus SAS policy name, e.g. `RootManageSharedAccessKey`    |
| MESSAGE_QUEUE_SUFFIX | Developer initials |

## GOV.UK Notify

This service depends on GOV.UK Notify to distribute statements.  The following environment variables need to be set
in any environment before the Docker container is started or tests are run. 

| Name | Description |
| ---| --- |
| NOTIFY_API_KEY | API key for GOV.UK Notify account |
| NOTIFY_EMAIL_TEMPLATE_KEY | Existing GOV.UK email template key |
| RETENTION_PERIOD_IN_WEEKS | No of weeks that document would be retained |

## Message schemas

All message schemas are fully documented in an [AsyncAPI specification](docs/asyncapi.yaml).

In order to verify the format set by RPA regarding the PDF filename structure, a regular expression has been created that will look for the following formats:
Product Code ( example: FFC ) : 3 to 6 uppercase characters, 
Descriptor ( example: PaymentStatement ) : any combination of words in PascalCase format, 
Scheme ID ( example: SFI ) : 3 to 6 uppercase characters, 
Scheme Year ( example : 2023 ) : 4 digits, 
FRN ( example : 1234567890 ) : 10 digits, 
Date and Time ( example : yyyymmddhhmmssxx ) : 16 digits,
File Designation ( example : .pdf ) : fixed to .pdf,
Each element is separated by an underscore ( example : _ ).

## Running the application

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```
# Build container images
docker-compose build
```

### Start

Use Docker Compose to run service locally.

```
./scripts/start
```

Sending an email via GOV.UK Notify will require the user to enter the email address associated with that document for security. Entering the wrong email will block them fromm downloading the file.

## Test structure

The tests have been structured into subfolders of `./test` as per the
[Microservice test approach and repository structure](https://eaflood.atlassian.net/wiki/spaces/FPS/pages/1845396477/Microservice+test+approach+and+repository+structure)

### Running tests

A convenience script is provided to run automated tests in a containerised
environment. This will rebuild images before running tests via docker-compose,
using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`.
The command given to `docker-compose run` may be customised by passing
arguments to the test script.

Examples:

```
# Run all tests
scripts/test

# Run tests with file watch
scripts/test -w
```

## CI pipeline

This service uses the [FFC CI pipeline](https://github.com/DEFRA/ffc-jenkins-pipeline-library)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
