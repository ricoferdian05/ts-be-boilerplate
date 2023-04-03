import path from 'path';
const rootDirectory = path.resolve(__dirname);

export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    },
  },
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '@server(.*)$': `${rootDirectory}/src$1`,
    '@config(.*)$': `${rootDirectory}/src/config$1`,
    '@models(.*)$': `${rootDirectory}/src/models$1`,
    '@tests(.*)$': `${rootDirectory}/__tests__$1`,
    '@middlewares(.*)$': `${rootDirectory}/src/middlewares$1`,
    '@validations(.*)$': `${rootDirectory}/src/validations$1`,
    '@definitions(.*)$': `${rootDirectory}/src/definitions$1`,
    '@utils(.*)$': `${rootDirectory}/src/utils$1`,
    '@v1-routes(.*)$': `${rootDirectory}/src/v1/routes$1`,
    '@v1-tests(.*)$': `${rootDirectory}/src/v1/__tests__$1`,
    '@v1-controllers(.*)$': `${rootDirectory}/src/v1/controllers$1`,
    '@v1-services(.*)$': `${rootDirectory}/src/v1/services$1`,
    '@v1-validations(.*)$': `${rootDirectory}/src/v1/validations$1`,
    '@v1-definitions(.*)$': `${rootDirectory}/src/v1/definitions$1`,
  },
  reporters: [
    'default',
    [
      path.resolve(__dirname, 'node_modules', 'jest-html-reporter'),
      {
        pageTitle: 'Test Report',
        outputPath: 'coverage/test-report.html',
      },
    ],
  ],
  rootDir: rootDirectory,
  roots: [rootDirectory],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: [`${rootDirectory}/__tests__/setup.ts`],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/build',
    `${rootDirectory}/__tests__/setup.ts`,
    `${rootDirectory}/__tests__/fixtures/`,
    `${rootDirectory}/__tests__/helper/`,
    `/src/v1/__tests__/fixtures/`,
    `/src/v1/__tests__/helper/`,
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: ['((/__tests__/.*)|(\\.|/)(test|spec))\\.tsx?$'],
  testEnvironment: 'node',
  testResultsProcessor: 'jest-sonar-reporter',
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/build', '/__tests__/', '/src/v1/__tests__/', '/__mocks__/'],
};
