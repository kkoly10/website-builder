type StoredReport = {
  createdAt: number;
  payload: any;
};

const store = new Map<string, StoredReport>();

export function createToken(payload: any) {
  const token = crypto.randomUUID();
  store.set(token, {
    createdAt: Date.now(),
    payload,
  });
  return token;
}

export function getByToken(token: string) {
  return store.get(token);
}
