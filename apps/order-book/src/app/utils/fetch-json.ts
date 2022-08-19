/**
 * Fetch wrapper that types json responses and throw an error in case of a
 * non successful response
 * @param params same as fetch parameters
 */
export async function fetchJson<T = unknown>(
  ...params: Parameters<typeof fetch>
) {
  const response = await fetch(...params);
  const jsonResponse = await response.json();

  if (!response.ok) {
    throw jsonResponse;
  }

  return jsonResponse as T;
}
