export function isMockPaymentsAllowed(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return (
    env.NODE_ENV === "development" ||
    env.NODE_ENV === "test" ||
    env.ALLOW_MOCK_PAYMENTS === "true"
  );
}
