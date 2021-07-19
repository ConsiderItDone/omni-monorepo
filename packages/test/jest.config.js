module.exports = {
  preset: "ts-jest",
  verbose: true,
  testEnvironment: "node",
  testTimeout: 60 * 1000,
  testMatch: ["**/jest/?(*.)+(spec|test).+(ts|tsx|js)"],
};
