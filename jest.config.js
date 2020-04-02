module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/cjs/'],
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.test.json',
    }
  }
};