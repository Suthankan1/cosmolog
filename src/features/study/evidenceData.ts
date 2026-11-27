import { EvidenceDossier, validateEvidenceDossier } from './evidence';

export const rawEvidenceDossiers: EvidenceDossier[] = [
  {
    id: 'dossier:wasp-39b-co2',
    revision: 1,
    headline: 'Transmission Spectrum of Exoplanet WASP-39 b',
    targetName: 'WASP-39 b',
    category: 'Exoplanet Transmission Spectroscopy',
    reviewedAt: '2026-11-26',
    observation:
      'High-precision infrared transmission spectroscopy recorded during planetary transit across host star WASP-39. Stellar light filtered through the atmospheric annulus shows a pronounced 4.3-micron absorption feature with a transit depth excess of approximately 1,200 parts per million.',
    method:
      'James Webb Space Telescope (JWST) Near-Infrared Spectrograph (NIRSpec) operating in PRISM mode (0.6 to 5.3 µm) at the Sun-Earth L2 Lagrange point. High-cadence time-series transit spectrophotometry separating stellar limb darkening from wavelength-dependent atmospheric absorption.',
    inference:
      'The 4.3 µm absorption signal provides definitive empirical evidence for molecular carbon dioxide (CO2) in an exoplanetary atmosphere, alongside previously identified water vapor (H2O), carbon monoxide (CO), and sulfur dioxide (SO2) photochemistry.',
    uncertainty:
      'Crucially, atmospheric carbon dioxide detection is NOT evidence of biological life or planetary habitability. WASP-39 b is a bloated gas giant world with an equilibrium temperature of ~900°C (1,150 K) orbiting 0.048 AU from its host star. Furthermore, empirical transmission spectra must be strictly distinguished from illustrative artist renderings: NIRSpec measures wavelength-dependent stellar flux dips, not optical visual planetary imagery. Absolute abundances carry model uncertainties due to aerosol haze scattering and metallicity degeneracy.',
    sourceRefs: [
      {
        id: 'S07',
        url: 'https://science.nasa.gov/asset/webb/exoplanet-wasp-39-b-nirspec-transmission-spectrum/',
        publisher: 'NASA / ESA / CSA / STScI',
        title: 'Exoplanet WASP-39 b NIRSpec Transmission Spectrum',
        accessedAt: '2026-11-26',
        license: 'NASA Open Media Guidelines',
        credit: 'NASA, ESA, CSA, Joseph Olmsted (STScI)',
        notes: 'Primary spectroscopic data release for JWST Transiting Exoplanet Community ERS Program.',
      },
      {
        id: 'S08',
        url: 'https://science.nasa.gov/mission/webb/science-overview/science-explainers/webbs-impact-on-exoplanet-research/',
        publisher: 'NASA Science',
        title: "Webb's Impact on Exoplanet Research",
        accessedAt: '2026-11-26',
        credit: 'NASA Goddard Space Flight Center',
        notes: 'Contextual analysis on molecular absorption fingerprints in gas giant atmospheres.',
      },
    ],
    relatedIds: ['chapter:deep-sky', 'exo:51-peg-b'],
    asset: {
      type: 'spectrum',
      label: 'NIRSpec Transmission Spectrum (Measured Data)',
      isArtistConcept: false,
      caption: 'Empirical transit depth vs infrared wavelength (0.6–5.3 µm) featuring the 4.3 µm CO2 absorption band.',
      credit: 'NASA, ESA, CSA, Joseph Olmsted (STScI)',
      sourceUrl: 'https://science.nasa.gov/asset/webb/exoplanet-wasp-39-b-nirspec-transmission-spectrum/',
    },
  },
  {
    id: 'dossier:europa-plume-candidates',
    revision: 1,
    headline: 'Far-Ultraviolet Spectroscopic Detection of Europa Plume Candidates',
    targetName: 'Europa',
    category: 'Ocean World Cryovolcanism',
    reviewedAt: '2026-11-26',
    observation:
      "Far-ultraviolet auroral emissions of atomic oxygen (OI 130.4 nm) and hydrogen Lyman-alpha in Europa's south polar region, and recurring limb transit absorption silhouettes observed against Jupiter's ultraviolet continuum.",
    method:
      'Hubble Space Telescope Space Telescope Imaging Spectrograph (STIS) and Advanced Camera for Surveys (ACS) in far-ultraviolet (FUV 115–170 nm) slit and prism modes. Statistical limb silhouette analysis across 10 transit observations.',
    inference:
      "Localized excess oxygen and hydrogen auroral emissions and limb silhouettes are consistent with transient water vapor (H2O) plumes erupting 160–200 km above Europa's icy surface from cryovolcanic venting.",
    uncertainty:
      "These detections represent candidate transient events, not continuously erupting geysers. Subsequent HST, ALMA, and ground-based observing campaigns frequently yield null results, demonstrating extreme intermittency or localized venting. Crucially, candidate water vapor plumes do NOT establish direct sampling or physical connectivity to Europa's global subsurface liquid ocean; venting could originate from shallow perched brine pockets in the 15–25 km thick ice crust. In-situ spacecraft validation by NASA Europa Clipper and ESA JUICE is required.",
    sourceRefs: [
      {
        id: 'S12-HST',
        url: 'https://science.nasa.gov/jupiter/moons/europa/',
        publisher: 'NASA Science',
        title: 'Europa Moons Science & Surface Plume Observations',
        accessedAt: '2026-11-26',
        credit: 'NASA / Jet Propulsion Laboratory',
        notes: 'Summary of auroral emissions and plume evidence.',
      },
      {
        id: 'S12-HUBBLE',
        url: 'https://science.nasa.gov/mission/hubble/science/',
        publisher: 'Space Telescope Science Institute',
        title: 'Hubble Space Telescope Spectrograph Research Archive',
        accessedAt: '2026-11-26',
        credit: 'NASA / STScI',
        notes: 'STIS far-ultraviolet transit spectroscopy datasets.',
      },
    ],
    relatedIds: ['chapter:worlds', 'moon:europa'],
    asset: {
      type: 'photo',
      label: 'Hubble FUV Composite & Candidate Plume Footprint',
      isArtistConcept: false,
      caption: 'Far-ultraviolet auroral detections mapped over Galileo optical surface imagery.',
      credit: 'NASA, ESA, Lorenz Roth (SwRI/KTH)',
      sourceUrl: 'https://science.nasa.gov/jupiter/moons/europa/',
    },
  },
  {
    id: 'dossier:sgr-a-stellar-orbits',
    revision: 1,
    headline: 'Two Decades of Astrometric Orbits Around Sagittarius A*',
    targetName: 'Sagittarius A*',
    category: 'Supermassive Black Hole Dynamics',
    reviewedAt: '2026-11-26',
    observation:
      'Two decades of diffraction-limited near-infrared astrometric positions and line-of-sight Doppler velocities tracking individual stars (notably S2 / S0-2) orbiting an unseen compact mass at the Galactic Center.',
    method:
      'Laser guide star adaptive optics imaging and integral-field spectroscopy (K-band, 2.2 µm) using W. M. Keck Observatory 10m telescopes (NIRC2/OSIRIS) and ESO Very Large Telescope 8.2m array (NACO/SINFONI/GRAVITY).',
    inference:
      'Star S2 traces a closed relativistic Keplerian orbit with a 16.05-year period and pericentre velocity of ~7,650 km/s (~2.5% of c) at 120 AU, enclosing a dark gravitational mass of (4.15 ± 0.13) × 10^6 solar masses inside a volume smaller than the Solar System, demonstrating a supermassive black hole.',
    uncertainty:
      'While stellar orbital dynamics provide irrefutable dynamical proof of an immense mass concentration, they do NOT directly resolve the event horizon or black hole shadow; event-horizon scale imaging required millimeter very-long-baseline interferometry by the Event Horizon Telescope (EHT). Optical observations are completely impossible due to 30 magnitudes of interstellar dust extinction in the Galactic plane. Gravitational redshift and pericentre precession measurements are consistent with general relativity, but do not constrain quantum gravitational departures near the central singularity.',
    sourceRefs: [
      {
        id: 'S12-BH',
        url: 'https://science.nasa.gov/universe/black-holes/',
        publisher: 'NASA Science',
        title: 'Supermassive Black Holes and Stellar Dynamics',
        accessedAt: '2026-11-26',
        credit: 'NASA Astrophysics Division',
        notes: 'Galactic Center compact mass dynamical analysis.',
      },
      {
        id: 'KECK-GC',
        url: 'https://www.keckobservatory.org/galactic-center/',
        publisher: 'W. M. Keck Observatory',
        title: 'UCLA Galactic Center Group Research Archive',
        accessedAt: '2026-11-26',
        credit: 'W. M. Keck Observatory / UCLA GCG',
        notes: 'Adaptive optics astrometric measurements for star S0-2 / S2.',
      },
    ],
    relatedIds: ['chapter:deep-sky', 'black-hole:sgr-a'],
    asset: {
      type: 'astrometry',
      label: 'S2 Orbit Astrometric Data Points (Empirical Track)',
      isArtistConcept: false,
      caption: 'Positions of star S2 measured between 1995 and 2020 around Sgr A*.',
      credit: 'ESO / MPE / UCLA Galactic Center Group',
      sourceUrl: 'https://science.nasa.gov/universe/black-holes/',
    },
  },
];

export const evidenceDossiers: EvidenceDossier[] = rawEvidenceDossiers.map(validateEvidenceDossier);
