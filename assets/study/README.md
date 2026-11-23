# City index, first edition

The bundled database adapts GeoNames cities15000 and Sri Lankan populated places. Historical, abandoned and destroyed populated places are excluded. Names, alternate names, administrative regions, country labels, coordinates, population and time zones come from GeoNames. Search keys have been folded for accent-insensitive matching. The index contains places from the 23 November 2026 download. [GeoNames data](https://www.geonames.org/export/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

To reproduce, download cities15000.zip, LK.zip, admin1CodesASCII.txt and countryInfo.txt from the [official dump directory](https://download.geonames.org/export/dump/). Run node scripts/build-cities.ts with these four paths and a fresh output database path. Bump the bundled database filename for each new revision.
