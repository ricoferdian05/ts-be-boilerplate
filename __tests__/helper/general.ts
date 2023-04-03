export function expectHaveSuccessMeta(body, message: string = 'ok') {
  expect(body).toHaveProperty('meta', expect.any(Object));
  expect(body.meta).toHaveProperty('message', message);
  expect(body.meta).toHaveProperty('status', 'success');
}

export function expectHaveFailedMeta(body, message: string) {
  expect(body).toHaveProperty('meta', expect.any(Object));
  expect(body.meta).toHaveProperty('message', message);
  expect(body.meta).toHaveProperty('status', 'failed');
}

export function expectToHaveInvalidObjectIdParam(body, paramName: string) {
  expect(body).toHaveProperty('meta', expect.any(Object));
  expect(body.meta).toHaveProperty(
    'message',
    expect.stringMatching(`"${paramName}" must only contain hexadecimal characters`) ||
      expect.stringMatching(`"${paramName}" length must be 24 characters long`),
  );
  expect(body.meta).toHaveProperty('status', 'failed');
}
