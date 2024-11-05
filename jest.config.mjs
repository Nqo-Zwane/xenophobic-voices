import { defaults } from 'jest-config';

export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(glsl|vert|frag)$': '<rootDir>/__mocks__/glsl.mock.js'
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx', 'node']
};
