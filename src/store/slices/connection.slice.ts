export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface ConnectionSlice {
  nmeaStatus: ConnectionStatus;
  pypilotStatus: ConnectionStatus;
  nmeaError: string | null;
  pypilotError: string | null;

  setNmeaStatus: (status: ConnectionStatus, error?: string) => void;
  setPypilotStatus: (status: ConnectionStatus, error?: string) => void;
}

export const createConnectionSlice = (
  set: (fn: (state: ConnectionSlice) => Partial<ConnectionSlice>) => void,
): ConnectionSlice => ({
  nmeaStatus: 'disconnected',
  pypilotStatus: 'disconnected',
  nmeaError: null,
  pypilotError: null,

  setNmeaStatus: (status: ConnectionStatus, error?: string) =>
    set(() => ({
      nmeaStatus: status,
      nmeaError: error ?? null,
    })),

  setPypilotStatus: (status: ConnectionStatus, error?: string) =>
    set(() => ({
      pypilotStatus: status,
      pypilotError: error ?? null,
    })),
});
