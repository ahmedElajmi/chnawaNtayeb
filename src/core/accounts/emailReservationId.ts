/**
 * Technical id of an e-mail reservation: the deterministic, reversible, collision-free
 * Base64URL (unpadded) encoding of the normalized address. The reservation id stays the
 * normalized e-mail until the storage switch — the mapping is prepared now (tested), the
 * transformation of existing reservations happens during the controlled switch, whose
 * reverse maps ids back exactly (Base64URL is reversible).
 */
export function emailReservationId(email: string): string {
  return Buffer.from(email, 'utf8').toString('base64url');
}
