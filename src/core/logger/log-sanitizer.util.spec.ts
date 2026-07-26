import { sanitizeLogPayload } from './log-sanitizer.util';

describe('sanitizeLogPayload', () => {
  it('should redact sensitive keys like password, token, secret, authorization', () => {
    const raw = {
      username: 'murali',
      password: 'SuperSecretPassword123!',
      token: 'jwt-bearer-token-val',
      authorization: 'Bearer token-123',
      nested: {
        secret: 'my-private-key',
        normalField: 'hello',
      },
    };

    const sanitized = sanitizeLogPayload(raw) as Record<string, unknown>;

    expect(sanitized['username']).toBe('murali');
    expect(sanitized['password']).toBe('[REDACTED]');
    expect(sanitized['token']).toBe('[REDACTED]');
    expect(sanitized['authorization']).toBe('[REDACTED]');

    const nested = sanitized['nested'] as Record<string, unknown>;
    expect(nested['secret']).toBe('[REDACTED]');
    expect(nested['normalField']).toBe('hello');
  });

  it('should handle arrays and primitive values safely', () => {
    expect(sanitizeLogPayload(null)).toBeNull();
    expect(sanitizeLogPayload('text')).toBe('text');
    expect(
      sanitizeLogPayload([{ password: '123' }, { name: 'item' }]),
    ).toEqual([{ password: '[REDACTED]' }, { name: 'item' }]);
  });
});
