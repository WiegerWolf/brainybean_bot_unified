import { test, expect, describe } from 'bun:test';
import { 
  sleep, 
  debounce, 
  extractErrorMessage, 
  formatBytes, 
  truncateString 
} from '../src/utils/helpers';

describe('Utility Functions', () => {
  test('sleep delays execution', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(150);
  });
  
  test('debounce delays function execution', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 50);
    
    fn();
    fn();
    fn();
    
    expect(callCount).toBe(0);
    
    await sleep(60);
    expect(callCount).toBe(1);
  });
  
  test('extractErrorMessage handles various error formats', () => {
    expect(extractErrorMessage({ message: 'Test error' }))
      .toBe('Error: Test error');
    
    expect(extractErrorMessage('String error'))
      .toBe('Error: String error');
    
    expect(extractErrorMessage({
      error: {
        metadata: {
          raw: JSON.stringify({
            error: { message: 'API error' }
          })
        }
      }
    })).toBe('Error: API error');
  });
  
  test('formatBytes formats correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
  
  test('truncateString truncates long strings', () => {
    expect(truncateString('Hello', 10)).toBe('Hello');
    expect(truncateString('Hello World', 8)).toBe('Hello...');
  });
});