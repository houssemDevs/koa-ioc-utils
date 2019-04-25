module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  notify: true,
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [6059, 18002, 18003, 2532, 2345],
      },
    },
  },
};
