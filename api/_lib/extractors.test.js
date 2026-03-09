import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGeminiQuota } from './extractors';

// Mock global fetch
global.fetch = vi.fn();

describe('getGeminiQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return used and limit from headers (Happy Path)', async () => {
    // Arrange
    const mockResponse = {
      ok: true,
      headers: new Map([
        ['x-ratelimit-limit-requests', '60'],
        ['x-ratelimit-remaining-requests', '45'],
        ['x-ratelimit-reset-requests', '10']
      ]),
      json: () => Promise.resolve({})
    };
    fetch.mockResolvedValue(mockResponse);

    // Act
    const result = await getGeminiQuota('fake-key');

    // Assert
    expect(result.provider).toBe('Gemini');
    expect(result.limit).toBe(60);
    expect(result.used).toBe(15); // 60 - 45
    expect(result.percent).toBe(25);
    expect(result.debug).toContain('H OK');
  });

  it('should infer 15 RPM for free tier when headers are missing', async () => {
    // Arrange
    const mockResponse = {
      ok: true,
      headers: new Map(),
      json: () => Promise.resolve({})
    };
    fetch.mockResolvedValue(mockResponse);

    // Act
    const result = await getGeminiQuota('fake-key');

    // Assert
    expect(result.limit).toBe(15);
    expect(result.used).toBe(0);
    expect(result.debug).toContain('Free');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockResponse = {
      ok: false,
      status: 403,
      headers: new Map(),
      json: () => Promise.resolve({ error: 'Invalid key' })
    };
    fetch.mockResolvedValue(mockResponse);

    // Act
    const result = await getGeminiQuota('invalid-key');

    // Assert
    expect(result.limit).toBe(0);
    expect(result.debug).toContain('St:403');
  });

  it('should handle network failures', async () => {
    // Arrange
    fetch.mockRejectedValue(new Error('Network failure'));

    // Act
    const result = await getGeminiQuota('fake-key');

    // Assert
    expect(result.limit).toBe(0);
    expect(result.debug).toContain('F:Network failure');
  });
});
