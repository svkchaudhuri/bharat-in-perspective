# HDRO data reuse review

Reviewed 12 September 2026 for Bharat in Perspective.

## Finding

HDRO explicitly licenses material on the Human Development Reports website under CC BY 3.0 IGO. This provides a public redistribution route for the downloadable HDR datasets. [1] UNDP's general terms defer to special terms, so their default restriction on redistribution does not override this specific grant for covered material. [2]

The licence permits sharing and adaptation, including commercial use, with attribution, a licence link and identification of adaptations. Preserve supplied notices, do not imply endorsement, and do not impose additional restrictions on the licensed material. It does not license UNDP branding or unrelated third-party data. [3]

## API-specific evidence and limit

The official HDR documentation identifies hdrdata.org as its API. [4] The five-page supplied API manual describes subscription and endpoints but contains no explicit redistribution licence. [5] The account verification and key delivery emails dated 11 September 2026 contain no additional redistribution terms; the latter requires keeping the key secure. Neither email nor any credential is copied into this repository.

It is reasonable to infer that the HDR licence covers the same HDRO indicators delivered through its official API, but this is not an express licence statement for the separate API domain. The portal remained on its loading screen during review, and its current signup conditions could not be verified. Absence of restrictions in the reviewed materials is not proof that none exist.

Status: public HDR website datasets have an explicit reuse basis. API-specific contractual clearance is not conclusively closed. For a launch requiring explicit coverage, use the official downloadable datasets for the public snapshot, or obtain HDRO confirmation before publishing the API-derived series. Such a data substitution has not been performed in this review.

## Publication requirements

Retain source, observation year, edition where known, and retrieval date. HDRO asks server-hosted data users to keep up with revisions; refresh before launch and establish an update process. A fixed edition is useful for comparisons but must not be presented as the newest release without checking. [1]

Suggested attribution: Source: UNDP Human Development Report Office, Human Development Reports data, CC BY 3.0 IGO. Bharat in Perspective selects, reformats and visualises the data; derived measures are identified separately. UNDP does not endorse this dashboard.

The API publication edition remains unspecified. This review grants no rights to other providers' data and does not certify overall deployment readiness.

## Optional confirmation text (not sent)

Please confirm whether the CC BY 3.0 IGO licence published at https://hdr.undp.org/terms-use also covers composite-index observations retrieved through my hdrdata.org API subscription, including storage in a public dashboard, charts and downloadable CSV/JSON snapshots. Are there additional subscription, attribution, caching, update or redistribution conditions? No API credentials would be published.

## References

1. HDRO, Terms of use: https://hdr.undp.org/terms-use
2. UNDP, Copyright and terms of use: https://www.undp.org/copyright-terms-use
3. Creative Commons, CC BY 3.0 IGO legal code: https://creativecommons.org/licenses/by/3.0/igo/legalcode.en
4. HDRO, Documentation and downloads: https://hdr.undp.org/data-center/documentation-and-downloads
5. HDRO, API manual (also supplied locally): https://hdr.undp.org/sites/default/files/2023-24_HDR/HDRO_data_api_manual.pdf
