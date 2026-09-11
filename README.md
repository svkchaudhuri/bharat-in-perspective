# Bharat in Perspective

A local, responsive dashboard for comparing India's development indicators with Singapore, Japan, China, the United States, Denmark, Norway, Sweden, Finland and Iceland.

## Start

Install Node.js 22 or newer, then run from this folder:

```text
npm start
```

Open http://127.0.0.1:4173 in a browser. No package installation or API key is needed. The bundled snapshot and charts work without internet; live events need internet. The server binds only to the local computer. Phone-width layouts are supported, but accessing this local server from a physical phone requires a separately configured deployment or network setup.

Use the local server for the complete dashboard, including state data and weather. Opening index.html directly only supports the embedded country snapshot.

## Current version: 0.3

Nine sections cover country comparisons, inequality, wellbeing, SDGs, research, Indian states, live context and source methods. State cards include deprivation indicators and domestic goods-flow maps. Weather includes a city-point forecast map and timeline; population totals remain annual estimates. The full-colour background is generated decorative artwork.

The repository includes ready-to-use snapshots. Source PDFs, workbooks and local inspection outputs are excluded; refresh/import scripts retain their official download locations. Optional HDRO refresh requires your own key in the HDRO_API_KEY environment variable. No key is required to run the saved dashboard.

## What is included

- 76 published-source series and five calculated measures, with available observations from 2000 onward.
- Ten countries, with India selected as the initial focus.
- Economic conditions, health, education, equity, food and nutrition, water and sanitation, environment, infrastructure and governance.
- Latest available, latest common year and fixed-year comparison modes.
- Historical charts, original metadata, missing values, observation ages and source links.
- Searchable indicator library with explicitly labelled integrations not yet connected.
- CSV exports of selected comparisons and indicator histories.
- Dark and light themes, laptop layout and mobile layout.
- A USGS magnitude 4.5+ earthquake map and event list for the past seven days. [2]

Statistics include World Bank WDI and WGI APIs. [1] Event context is inspired by World Monitor's separation of map layers and signals. This project does not use World Monitor code or its service. [3]

Human development measures use the UNDP HDR 2025 edition. [4] Food-safety capacity uses the WHO SPAR second edition, beginning in 2021. [5] Both are connected for all ten selected economies; individual years can still be missing.

## Refresh the statistical snapshot

```text
npm run refresh
```

Reload the browser after the refresh completes. The retrieval script uses a maximum of five concurrent indicator workers, retries failed downloads and keeps the last successful series if an upstream request fails. The UI marks retained data as cached. With no prior data, it shows unavailable. It never generates substitute statistics.

`data/snapshot.json` contains observations, source URLs, definitions where supplied, original provider metadata and retrieval timestamps. `data/snapshot.js` supplies the same snapshot to the browser, including direct file viewing. The source dataset update date is distinct from the observation year and retrieval date.

The event page requests the feed every five minutes while it is open. The server caches results for five minutes and labels cached responses after failures. No scheduled background job is installed.

## Interpretation

The latest-available mode can mix years. The common-year mode selects a year separately for each indicator, requiring observations for every selected country. A fixed year never backfills missing values. Trend charts keep missing years as gaps. The history start-year control changes the history chart, independently of the comparison period.

Scandinavia means Denmark, Norway and Sweden. Finland and Iceland are additional Nordic countries. No regional average is calculated. GDP per capita is PPP-adjusted in constant 2021 international dollars. Gross enrolment can exceed 100%; provider definitions are essential for interpretation. Governance estimates use the revised `GOV_WGI_*.EST` series. The API currently omits explanatory text for these series; the UI discloses missing definitions. Consult the revised WGI documentation, including uncertainty intervals. [6]

## Coverage that still needs work

This is an extensible first version, not an exhaustive collection of every world metric. Two planned integration entries remain visible in the library:

- WHO foodborne disease deaths/DALYs.
- National food recalls and enforcement actions.

Food security and nutrition do not directly measure food safety. WHO foodborne disease estimates and regulator data need version-aware adapters and comparability checks before publication. [7] National recall counts should not become a league table: more recalls can reflect stronger surveillance.

Further live layers could include official weather alerts, disaster reports, public health events and sourced news. None is simulated in this version. The current geographic event filters are bounding boxes, not national boundaries.

## Validation

```text
npm test
```

Tests cover latest-year selection, exact-year missingness, valid zero values, common-year matching, CSV quoting, snapshot uniqueness, finite values, valid countries and metadata shape. Browser checks and remaining limitations are recorded in `REVIEW.md`.

## Project layout

- `catalog.mjs`: country and indicator registry, plus planned integrations.
- `scripts/refresh.mjs`: public-source retrieval and snapshot refresh.
- `scripts/secondary.mjs`: UNDP and WHO adapters with explicit edition boundaries.
- `model.js`: comparison rules shared by browser and tests.
- `server.mjs`: local static server and cached USGS feed endpoint.
- `index.html`, `style.css`, `app.js`: interface and charts.
- `data/`: reproducible snapshot and retrieval metadata.
- `vendor/`: pinned Chart.js 4.5.1 and Natural Earth land geometry.
- `tests/`: data and comparison tests.

The project has not been pushed to GitHub. A suitable future repository name is `india-world-observatory`. Public deployment should add hosting configuration, an explicit data-refresh schedule, uptime monitoring and a review of each provider's reuse and attribution requirements.

## References

1. World Bank, Indicators API documentation. https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
2. USGS, GeoJSON summary feed. https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
3. World Monitor, Introduction. https://www.worldmonitor.app/docs/documentation
4. UNDP, HDR documentation and downloads. https://hdr.undp.org/data-center/documentation-and-downloads
5. WHO, Food safety IHR core capacity. https://www.who.int/data/gho/data/indicators/indicator-details/GHO/food-safety-ihr
6. World Bank, Worldwide Governance Indicators, 2025 revision. https://www.worldbank.org/en/publication/worldwide-governance-indicators
7. WHO, Estimating the burden of foodborne diseases. https://www.who.int/activities/estimating-the-burden-of-foodborne-diseases


## Expansion: wellbeing, distribution, SDGs and research

Version 0.2 adds four views and expands the catalogue to 64 published-source series plus five calculated distribution measures (69 total; 13,615 observations in this snapshot).

- **Planet & wellbeing:** World Happiness Report 2026 life evaluations, CO2 emissions per person, PM2.5, safe water, sanitation and renewable energy. Happiness is a three-year survey average, not an annual objective quality-of-life score. [8]
- **SDG progress:** SDSN's 2026 report assessment, 17 goals, underlying indicators and changes within its backdated historical series. This is complementary to the UN framework, not an official UN national scorecard. The tab uses its own focus-country control and deliberately does not apply the main comparison-period selector. [9]
- **Research landscape:** DST Tables 2, 9 and 23: spending by institutional sector, state-government spending and research-personnel specialisation. Detailed breakdowns are India-only. The discipline table explicitly excludes higher education. [10]
- **Shared prosperity:** Gini, bottom-40% welfare share, Palma ratio, bottom-40% mean relative to the national mean, bottom-40% welfare growth, shared prosperity premium and loss of human development due to inequality. [11]

GDP is aggregate economic output; GDP per capita divides output by population. It is not calculated simply by averaging the reported incomes of rich and poor households. Distribution measures complement GDP, rather than replacing it with an arbitrary adjustment.

The bottom-40% relative mean is `(bottom 40% welfare share / 40) × 100`. For India in 2022, 24.6% of consumption was held by the bottom 40%, giving 61.5% of the national survey mean. Palma is `top 10% share / bottom 40% share`. These are consumption-based for India, not income or wealth measures. Cross-country comparisons must retain the income-versus-consumption warning.

The shared prosperity premium subtracts national-mean real welfare growth from bottom-40% real welfare growth. It is computed only where survey intervals and welfare types match. The connected World Bank API has no India observations for these two growth series in this snapshot; India therefore shows unavailable. No GDP-growth substitute is inserted.

### Edition-pinned source refresh

The normal `npm run refresh` updates World Bank/UNDP/WHO adapters, recalculates distribution measures and incorporates the bundled edition data. The WHR 2026, SDR 2026 and DST 2025–26 releases are deliberately pinned. Reimport them with Python 3 and openpyxl:

```text
python scripts/import_editions.py --download
node scripts/enrich.mjs --existing
```

`data/editions.json` preserves source URLs, retrieval dates and SHA-256 hashes. Original source files are in `data/sources/`. The DST numbers are explicitly transcribed from identified tables, so a new report edition requires reviewing the transcription, not only changing its URL. WHO and UNDP continue to use their existing adapters. No Python is required merely to run the dashboard.

### Additional references

8. World Happiness Report 2026, Figure 2.1 data. https://www.worldhappiness.report/data-sharing/
9. SDSN, Sustainable Development Report 2026 database and methodology. https://dashboards.sdgindex.org/downloads/
10. DST, S&T Indicators Tables 2025–26, Tables 2, 9 and 23. https://dst.gov.in/sites/default/files/ST%20INDICATORS%20TABLES%202025-26.pdf
11. World Bank, Poverty and Inequality Platform. https://pip.worldbank.org/


## HDRO subscription integration

Twelve separately labelled HDRO API series now supplement the fixed HDR 2025 CSV series: HDI, IHDI, published inequality loss, three dimension inequality measures, GDI, female/male HDI, PHDI, planetary-pressure reduction and material footprint. Shared prosperity and Wellbeing & planet expose these cards; Explore series provides historical and country comparisons.

The authenticated endpoint and parameter syntax follow the supplied HDRO API manual. The subscription key is read only by the local refresh process, from HDRO_API_KEY or ../Apikey.txt outside this project. It is sent only to https://hdrdata.org/api/ with redirects disabled. Never commit the parent credential file. Browser snapshots contain only a keyless endpoint address and published observations.

Run `node scripts/hdro.mjs --refresh` then `node scripts/enrich.mjs --existing` for an HDRO-only update. The normal refresh also attempts HDRO; failed requests preserve earlier observations and mark the retained API snapshot cached. The direct HDRO-only command exits unsuccessfully on failure and leaves the prior file intact. Restart is unnecessary for data-only changes; reload the browser.

API data are a dated retrieval snapshot, not a real-time event feed. The response does not supply a report edition, so do not splice these series into the fixed HDR 2025 histories. Missing observations remain absent. GDP is total output; GDP per capita divides this by population. IHDI is an established inequality-adjusted human-development measure, not inequality-adjusted GDP. GDI parity is near 1; PHDI is not evidence of carbon neutrality. [12]

[12] UNDP, Human Development Report data documentation: https://hdr.undp.org/data-center/documentation-and-downloads. API access syntax: user-supplied HDRO_data_api_manual.pdf.

## Dashboard identity
Bharat in Perspective is the display name. The header includes an accessible inline Indian tricolour with a 24-spoke Ashoka Chakra. assets/india-landscape.png is AI-generated decorative artwork combining impressions of Hawa Mahal, the Taj Mahal, the Himalayas and Kerala backwaters; it is not documentary photography or a geographically continuous scene. Theme-specific fades keep the imagery subdued, and data panels remain opaque. Reviewed at 390px mobile and 1366px laptop widths in the browser.

## Full-page landmark backdrop
The updated decorative montage adds Kolkata's Howrah Bridge to the existing landmarks. It is displayed at its original colour and opacity as the full-page background in both themes, without fading gradients. Solid surfaces behind data and text maintain readability. This supersedes the earlier faded-background styling.

## States, weather and section navigation (v0.3)
Each navigation button changes the main heading, introduction and browser title, moves keyboard focus to the section heading, and brings that heading into view. A short transition respects reduced-motion settings. The data-wide refresh banner is now confined to Overview.

Live context includes the official Windy embed, 15 selectable city points using Open-Meteo, a 14-day temperature table/chart (7 previous model days plus 7 forecast days including today), and annual population totals/changes for the ten comparison economies. Weather refreshes every 15 minutes only while the section is active; the iframe unloads on leaving it. A failed fetch explicitly reports unavailability or labelled cached data. Population is never animated into a fictitious real-time count. The Open-Meteo free endpoint is for non-commercial use; review service terms if the project becomes commercial.

States of India covers 28 states and 8 union territories. NITI MPI 2023 Tables 1 and 4 provide poverty headcount, intensity, MPI, and 12 deprivation measures for 2015-16 and 2019-21. Domestic incoming/outgoing goods profiles use DGCI&S e-way bills for 2023-24. The all-goods matrix contains 1,051 non-self numeric links; 32 states/UTs have separate goods profiles. Other Territory is retained as an aggregate and never geographically assigned to a specific state. Both the state matrix and commodity totals reconcile against the workbook's reported inward/outward totals.

The rail layer contains 2,575 non-self links across 66 reported commodity groups for 2024-25 in tonnes. Table IV was independently reconciled against 1,129 numeric state-commodity entries in Table II. The map is a point-and-arrow overview on a Natural Earth land basemap, with approximate representative locations, not state boundaries or actual transport routes. The map plots the 8 largest mapped partners; the table/CSV retains every reported positive partner. Shares use all reported partners for the selected state/direction/commodity, not total consumption. Rail and e-way-bill data are never added together.

International export profiles are linked separately to NITI's EPI 2024 report. The domestic goods lists are not labelled international imports/exports. International imports by consuming state remain unintegrated. E-way-bill data are subject to the substantial quality concerns and territorial aggregation stated by DGCI&S; this is visible in the app. No population, missing state measure, or trade edge is simulated.

Reproduce state snapshots after fetching sources: `python scripts/import_states.py` then `python scripts/import_rail.py`. The scripts require openpyxl and the downloaded source files in data/sources. SHA-256 provenance is retained in data/states.json. These are fixed annual editions and are not refetched by the general country-indicator refresh. Normal startup remains `node server.mjs`.

[13] NITI Aayog, National Multidimensional Poverty Index: Progress Review 2023, Tables 1 and 4. https://niti.gov.in/sites/default/files/2023-07/National-Multidimentional-Poverty-Index-2023-Final-17th-July.pdf
[14] DGCI&S, E-way-bill movement workbook 2023-24, Tables I, III and IV. https://www.dgciskol.gov.in/writereaddata/Downloads/Road_EwayBill_2023_24.xlsx
[15] DGCI&S, E-way-bill report 2023-24, source-quality and methodology notes, PDF pages 18-19. https://www.dgciskol.gov.in/writereaddata/Downloads/20260116130259Draft_Final_report_23_24.pdf
[16] NITI Aayog, Export Preparedness Index 2024 (published 2026). https://www.niti.gov.in/sites/default/files/2026-01/Export_Preparedness_Index_2024.pdf
[17] DGCI&S, Rail 2024-25, Tables II and IV. https://www.dgciskol.gov.in/pub_inland.aspx
[18] Windy embed. https://embed.windy.com/
[19] Open-Meteo Forecast API. https://open-meteo.com/en/docs

### Final weather-map implementation
Windy's iframe remained blank in the in-app preview despite a successful provider HTTP response. The final UI therefore uses a local SVG city-point forecast map with a seven-day slider and play/pause control, plus a direct link to the full Windy map. There is no embedded iframe in the final version. The local map shows six Indian cities or all 15 comparison-city points, with separate layers for daily maximum temperature, total precipitation and maximum wind speed. Values come from Open-Meteo and are not interpolated into a continuous field. The table retains point timestamps and missing coverage. This supersedes the embedded-map description above. Both point forecasts and map data refresh on a 15-minute interval while Live context is active; timeline playback stops when leaving the tab.
