import * as Crypto from 'expo-crypto'

export async function sha256(input: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: Crypto.CryptoEncoding.HEX },
  )
  return digest
}
