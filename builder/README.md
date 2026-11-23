# Custom builder: Chromium for the report-service

`report-service` renders PDFs with Puppeteer, which downloads its own
headless Chromium binary during `npm install` - but that binary still needs
a handful of OS shared libraries (libnss3, libgtk-3-0, libpango, etc.) to
actually launch. Minimal buildpack run images don't ship them, which is the
real reason this app needs a custom builder rather than the default one.

This directory defines that builder as two pieces, combined by `builder.toml`:

- **`buildpacks/chromium`** - a small, local Cloud Native Buildpack (`bin/detect`
  + `bin/build`, no framework). It downloads the Debian packages Puppeteer's
  own troubleshooting guide recommends (<https://pptr.dev/troubleshooting#running-puppeteer-in-docker>)
  with `apt-get download` and unpacks them with `dpkg -x` (no root needed) into
  a layer, then exports `LD_LIBRARY_PATH`/`PATH` for that layer at launch time.
- **`paketo-buildpacks/nodejs`** - the standard Paketo buildpack, which
  installs Node.js and runs `npm install` / `npm start` as usual. It runs
  *after* the chromium buildpack so Puppeteer's own Chromium download
  during `npm install` lands in an image that can already run it.

## Building it

```powershell
pack builder create ghcr.io/<your-org>/examresults-chromium-builder:latest --config builder.toml
docker push ghcr.io/<your-org>/examresults-chromium-builder:latest
```

Before running this, open `builder.toml` and pin the actual current
`paketo-buildpacks/nodejs` version/image reference (check
<https://github.com/paketo-buildpacks/nodejs/releases>) - it's left as a
placeholder here because Paketo releases move faster than this example repo
can track.

Then point `report-service/epinio.yml`'s `staging.builder` at the image you
pushed, and `epinio push` it as usual.

## Caveat

This was written and reasoned through against the Cloud Native Buildpacks
spec and Puppeteer's own documented Docker requirements, but it has **not**
been verified end-to-end against a live Epinio/Kubernetes cluster (none was
available while building this example). Before relying on it, build the
image, push `report-service`, and confirm `/render` actually returns a PDF -
if Puppeteer still fails to launch, `epinio app logs report-service` and
`ldd $(node -e "console.log(require('puppeteer').executablePath())")`
(run via `epinio app exec`) will show exactly which shared library is still
missing, and the package list in `buildpacks/chromium/bin/build` can be
extended accordingly.
