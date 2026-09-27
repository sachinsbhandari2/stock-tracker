// A small, zero-API-cost list of well-known tickers for autocomplete
// suggestions, spanning the AI/tech stack bottom (equipment) to top
// (applications). Combined at runtime with tickers already looked up
// (from the snapshots table) to form the full suggestion pool.
export const COMMON_TICKERS = [
  // Equipment
  "ASML", "AMAT", "LRCX",
  // Memory
  "MU", "SNDK", "SKHY", "SSNLF",
  // Chips
  "NVDA", "AMD", "AVGO", "INTC", "TSM",
  // AI models (public)
  "GOOGL", "META", "MSFT", "BABA",
  // Cloud infra
  "AMZN", "ORCL",
  // AI software/data
  "PLTR", "SNOW", "MDB", "DDOG", "CRWD",
  // Applications
  "CRM", "NOW", "ADBE", "SAP",
];
