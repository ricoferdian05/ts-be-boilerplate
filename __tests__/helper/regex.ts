const TEST_TIMEOUT_MS = 5000;

interface EndpointResponse {
  body: {
    meta: {
      message: string;
    };
  };
}

export function testRegexSearch(requestEndpoint: (searchString: string) => Promise<EndpointResponse>): void {
  it(
    'does not return regex error from search',
    async () => {
      // prettier-ignore
      const searchTestStrings = [
        'apple\\orange',
        'word\\',
        '(word',
        'word)',
        '^ {0}*'
      ];

      for (const search of searchTestStrings) {
        const { body } = await requestEndpoint(search);
        expect(body.meta.message).not.toEqual(expect.stringContaining('Regular expression is invalid'));
      }
    },
    TEST_TIMEOUT_MS,
  );
}
