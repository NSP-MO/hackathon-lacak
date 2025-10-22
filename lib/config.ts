import path from "path"

export const DATA_DIR = path.join(process.cwd(), "data")

export const VERIFICATION_SECRET =
  process.env.LACAK_VERIFICATION_SECRET ?? "LACAK_VERIFICATION_PEPPER_2024"

export const BLOCKCHAIN_SECRET =
  process.env.LACAK_BLOCKCHAIN_SECRET ?? "LACAK_BLOCKCHAIN_PEPPER_2024"

export const BLOCKCHAIN_DIFFICULTY = 3

export const AUDIT_LOG_LIMIT = 5000
