# askdeen

Get started by running the following in the root directory:

```bash
pnpm sst dev
```

## Packages

### `/packages/core`

Any shared code, scripts, etc.

Not directly ran unless via other packages below.

### `/packages/site`

Standard NextJS 14 site

Run with:

```bash
pnpm run dev
```

### `/packages/functions`

AWS API Gateway with Lambdas

Runs with above command `pnpm sst dev`

## SST Console

[View SST logs](https://console.sst.dev/canogadigital-dev)

## Paid Services

- AWS
- PineconeDB
- Vercel
- OpenAI
