// Define our stub function type
export type StubFunction = {
  calls: Array<{ args: unknown[] }>;
  restore: () => void;
  returns: <T>(value: T) => StubFunction;
  rejects: (error: Error) => StubFunction;
};

// Create a utility type for functions
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Creates a stub for a method on an object
 * This version uses a safer approach with Deno's strict type checking
 */
export function createStub<T extends Record<string, unknown>>(
    obj: T,
    methodName: string
): StubFunction {
  // Check if the method exists
  if (!(methodName in obj)) {
    throw new Error(`Method ${methodName} does not exist on object`);
  }

  // Get the original method
  const method = obj[methodName];

  // Validate it's a function
  if (typeof method !== 'function') {
    throw new Error(`Cannot stub non-function property ${methodName}`);
  }

  // Save original with correct typing
  const originalMethod = method as AnyFunction;

  // Track calls
  const calls: Array<{ args: unknown[] }> = [];

  // Setup implementation
  let stubImplementation: AnyFunction = () => undefined;

  // Create the stub function
  const stubFn: AnyFunction = function(...args: unknown[]): unknown {
    calls.push({ args });
    return stubImplementation(...args);
  };

  // Replace the original with our stub using an index signature approach
  // This avoids the strict type assignability error
  (obj as Record<string, unknown>)[methodName] = stubFn;

  // Build the controller object
  const stubObj: StubFunction = {
    calls,
    restore: () => {
      (obj as Record<string, unknown>)[methodName] = originalMethod;
    },
    returns: <T>(value: T): StubFunction => {
      stubImplementation = () => value;
      return stubObj;
    },
    rejects: (error: Error): StubFunction => {
      stubImplementation = () => Promise.reject(error);
      return stubObj;
    }
  };

  return stubObj;
}

/**
 * Asserts that a stub was called a specific number of times
 * @param stub The stub to check
 * @param expectedCalls The expected number of calls
 */
export function assertCalls(stub: StubFunction, expectedCalls: number): void {
  if (stub.calls.length !== expectedCalls) {
    throw new Error(`Expected ${expectedCalls} calls, but got ${stub.calls.length}`);
  }
}

/**
 * Asserts that a specific call to a stub had the expected arguments
 * @param stub The stub to check
 * @param callIndex The index of the call to check
 * @param expectedArgs The expected arguments of the call
 */
export function assertCallArgs(stub: StubFunction, callIndex: number, expectedArgs: unknown[]): void {
  if (callIndex >= stub.calls.length) {
    throw new Error(`Call index ${callIndex} out of bounds (total calls: ${stub.calls.length})`);
  }

  const actualArgs = stub.calls[callIndex].args;

  // Basic equality check
  for (let i = 0; i < expectedArgs.length; i++) {
    if (i >= actualArgs.length) {
      throw new Error(`Expected argument at index ${i}, but call only had ${actualArgs.length} arguments`);
    }

    // Simple string comparison - limited but functional
    if (JSON.stringify(actualArgs[i]) !== JSON.stringify(expectedArgs[i])) {
      throw new Error(`Argument mismatch at index ${i}:\nExpected: ${JSON.stringify(expectedArgs[i])}\nActual: ${JSON.stringify(actualArgs[i])}`);
    }
  }
}