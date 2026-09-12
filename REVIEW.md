# Review before publication

## Version 0.1 baseline result

The local prototype includes 52 connected series, 11,096 non-null observations, ten economies and a live USGS earthquake feed. The initial snapshot was retrieved on 11 September 2026. All 52 series returned data successfully. This is a broad, extensible first release, not an exhaustive inventory of world indicators.

## Version 0.1 validation

- Fourteen automated checks passed, covering comparison years, missingness, zero values, CSV quoting, UNDP CSV parsing, observation uniqueness, numeric validity, country coverage, metadata shape and WHO edition boundaries.
- The official UNDP CSV lists India's 2023 HDI as 0.685; the dashboard retains that value and precision.
- Common-year mode selected 2024 for life expectancy and 2023 for food-safety capacity. Adult literacy correctly produced no common-year comparison for the default country group.
- A fixed-year adult-literacy comparison showed missing observations rather than borrowing older values.
- Changing focus to Japan and selecting all Nordic countries updated the table to ten countries.
- Library filtering distinguished connected food-safety capacity from unconnected burden and recall data.
- The local server retrieved the live USGS feed successfully; region filtering produced a corresponding subset.
- Browser views were inspected at 1366 by 900, 390 by 844 and 360 by 800 pixels. A mobile overflow issue was corrected. Light and dark themes were checked.
- Export buttons ran without console errors. The embedded browser did not return a download-completion event, so saving the resulting files through that browser has not been independently confirmed. CSV generation and parsing rules have automated tests.

## What I would fix or add before public release

1. Add governance uncertainty intervals, especially before encouraging comparisons of small country differences. The current revised API leaves some definition/provider fields blank; the UI shows that limitation.
2. Add foodborne disease burden from a comparable WHO release, with uncertainty ranges. The connected SPAR score measures self-reported capacity rather than food contamination or illness.
3. Add national recall feeds with jurisdiction and reporting-system context. Do not rank countries by raw recall counts.
4. Add an explicit statistical refresh schedule and monitor failed source requests. UNDP is intentionally pinned to HDR 2025; adopting a later edition needs a deliberate review.
5. Confirm downloads in the target production browsers and test on physical iOS and Android devices. Current mobile verification uses browser viewport sizes.
6. Review source reuse requirements and add deployment/uptime configuration. The present server is local-only; public hosting and access from a separate phone are not configured.

No GitHub repository was created and nothing was pushed. The next design review can focus on which indicators belong on the landing page, how dense the mobile overview should be, and which live sources would be useful.

## Version 0.2 review

The expansion adds happiness, CO2 footprint, shared prosperity, SDG progress and research breakdowns. There are now 64 source series and five calculated measures. SDG goal histories and source details are separate structured panels.

- Twenty-three automated checks pass, including same-survey derived measures, mismatched growth-period rejection, unavailable India growth values, happiness uncertainty bounds where supplied, all 17 SDG goals and DST subtotal reconciliation.
- DST discipline and institutional-spending figures were visually checked against PDF pages 48 and 19. The state-government figures were extracted from Table 9, PDF page 27, and the total was reconciled within rounding tolerance.
- Happiness confidence intervals are missing for some older observations in the original workbook. Those remain missing and are disclosed; they are not inferred.
- Laptop (1366 pixels) and mobile (390 pixels) layouts were checked for the added views. No document-wide horizontal overflow was present; wide detail tables scroll within their own containers.
- India has no current bottom-40% growth or shared prosperity premium in this API snapshot. That is a source-coverage limitation, not zero growth.
- India's consumption-distribution measures must not be described as income or wealth inequality. The source notes and in-view warning retain this distinction.
- SDSN goal scores are not percentages of all UN targets completed. The report-year assessment and observation-year history remain explicitly labelled.
- The research personnel-by-discipline table excludes higher education and does not count laboratories. State-government spending is not all R&D spending geographically located in a state.

Before publication, I would still prioritise wealth-distribution data with compatible definitions, fuller research-infrastructure coverage including universities, governance uncertainty intervals, and physical-device/download checks. No GitHub push has been performed.


## HDRO integration review
Authenticated retrieval succeeded for all 10 economies and 12 series. India 2023: HDI 0.685, IHDI 0.475, published inequality loss 30.657%, PHDI 0.656, GDI 0.874. API and fixed-edition series are explicitly distinguished. Remaining limitation before publication: API publication edition is unspecified, source observation years lag retrieval, and the dashboard should not imply that inequality losses are GDP losses or that PHDI measures net-zero status. The 12 September 2026 review confirms CC BY 3.0 IGO for HDR website datasets; API-domain coverage remains an interpretation pending explicit confirmation. See HDRO_REUSE_REVIEW.md for the evidence, publication requirements and an explicitly licensed download-based alternative.

## v0.3 review: states and live context
31 automated tests pass. State human data retain source observation periods; e-way-bill matrix row/column orientation was checked against the independent inward and outward totals (columns are origins, rows are destinations). Rail commodity flows reconcile against 1,129 independently published Table II cells. Unknown/aggregated territories are not invented map locations. Shares measure recorded movement, not essential-supply dependence. The current state health/education figures are deprivation measures under national MPI household rules, not a new HDI. Foreign-import coverage by consuming state remains unintegrated; the app clearly separates domestic movements from linked international-export profiles. Publication must retain DGCI&S quality caveats and the different transport coverage/units/periods. Windy is a third-party iframe with an external-link fallback. Weather is model-based and population annual; neither is advertised as a census or station observation in real time.

Final browser review found the Windy frame blank in the preview; the final implementation replaces it with a working Open-Meteo city-point forecast map and seven-day play/pause timeline. Full Windy remains an external link. This is deliberately labelled sparse city-point coverage, not a continuous wind or rainfall field.
