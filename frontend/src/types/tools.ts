export interface ConfirmationRequest {
  confirmId: string;
  name: string;
  args: Record<string, unknown>;
}
