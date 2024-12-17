import useHelloWorld from './helloWorldHook';

describe('useHelloWorld', () => {
  it('should return "Hello, Next.js!"', () => {
    const result = useHelloWorld();
    expect(result).toBe('Hello, Next.js!');
  });
});